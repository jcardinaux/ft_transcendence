import { logError, logInfo } from "../utils/logger.js";

export interface userListCardOptions {
	id: number;
	avatar: string;
	username: string;
	nickname: string;
	isFriend?: boolean;
	isOnline?: boolean;
	lastSeen?: string | null;
}

export class UserListCard {
	element: HTMLElement;
	private options: userListCardOptions;

	constructor(options: userListCardOptions) {
		this.options = options;
		const wrapper = document.createElement('div');
		wrapper.className = 'UserListCard';

		wrapper.innerHTML = `
			<div class="flex justify-between items-start gap-4">
				<div class="flex justify-start gap-8 mb-2">
					<img src="${options.avatar}" alt="avatar" class="w-10 h-10 object-cover" />
					<div class=" flex flex-col text-start">	
						<span> username: ${options.username}</span>
						<span> nickname: ${options.nickname}</span>
					</div>
				</div>
				<div class="flex flex-col items-end gap-2">
					<button class="btn-win98 add-friend-btn"> add friend </button>
					<div class="friend-status text-sm text-gray-700 hidden"></div>
				</div>
			</div>
			<hr class=" border-2 border-b-gray-200 border-t-gray-400 mb-4">
		`;

		this.element = wrapper;
	}

	async init() {
		const button = this.element.querySelector('.add-friend-btn') as HTMLButtonElement;
		const statusElem = this.element.querySelector('.friend-status') as HTMLDivElement | null;
		const token = localStorage.getItem('token');
		let isFriend = Boolean(this.options.isFriend);
		this.updateButtonLabel(button, isFriend);
		this.updateStatus(statusElem, isFriend, this.options.isOnline ?? false, this.options.lastSeen ?? undefined);

		button.addEventListener('click', async () => {
			if (!token) {
				logError('missing auth token for friend action');
				return;
			}
			if (!isFriend) {
				try {
					const response = await fetch(`/api/profile/addFriend/${this.options.id}`, {
						method: 'POST',
						headers: {
							'accept': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: ''
					});
					if (response.status === 200) {
						logInfo(`Successfully added friend ${this.options.username}`);
						isFriend = true;
						const friendInfo = await this.fetchFriendStatus(token);
						this.updateStatus(statusElem, true, Boolean(friendInfo?.is_online), friendInfo?.last_seen);
						this.dispatchFriendsRefresh();
					} else {
						const errorMsg = await response.text();
						logError(`Error adding friend: ${errorMsg}`);
					}
				} catch (err) {
					logError(`impossible add ${this.options.username} as friend`);
				}
			} else {
				try {
					const response = await fetch(`/api/profile/deleteFriend/${this.options.id}`, {
						method: 'DELETE',
						headers: {
							'accept': 'application/json',
							'Authorization': `Bearer ${token}`
						},
						body: ''
					});
					if (response.status === 200){
						logInfo(`Successfully removed friend ${this.options.username}`)
						isFriend = false;
						this.updateStatus(statusElem, false, false, undefined);
						this.dispatchFriendsRefresh();
					} else {
						const errorMsg = await response.text();
						logError(`Error removing friend: ${errorMsg}`);
					}
				} catch (err) {
					logError(`impossible remove ${this.options.username} from friend`);
				}
			}
			this.updateButtonLabel(button, isFriend);
		});
	}

	private dispatchFriendsRefresh() {
		window.dispatchEvent(new CustomEvent('friends-refresh'));
	}

	private updateButtonLabel(button: HTMLButtonElement, isFriend: boolean) {
		button.textContent = isFriend ? 'remove friend' : 'add friend';
	}

	private updateStatus(element: HTMLDivElement | null, isFriend: boolean, isOnline: boolean, lastSeen?: string) {
		if (!element)
			return;
		if (!isFriend) {
			element.classList.add('hidden');
			element.textContent = '';
			return;
		}
		element.classList.remove('hidden');
		const statusColor = isOnline ? 'text-green-700' : 'text-gray-600';
		const dotColor = isOnline ? 'bg-green-500' : 'bg-gray-400';
		const lastSeenLabel = !isOnline && lastSeen ? ` · ultimo accesso ${this.formatDate(lastSeen)}` : '';
		element.innerHTML = `
			<span class="inline-flex items-center gap-2 ${statusColor}">
				<span class="inline-block w-3 h-3 rounded-full ${dotColor}"></span>
				${isOnline ? 'Online' : 'Offline'}${lastSeenLabel}
			</span>
		`;
	}

	private formatDate(value?: string) {
		if (!value)
			return '';
		const date = new Date(value);
		if (Number.isNaN(date.getTime()))
			return value;
		return date.toLocaleString('it-IT', {hour12: false});
	}

	private async fetchFriendStatus(token: string) {
		try {
			const response = await fetch(`/api/profile/getFriends?ts=${Date.now()}`, {
				method: 'GET',
				headers: {
					'accept': 'application/json',
					'Authorization': `Bearer ${token}`
				},
				cache: 'no-store'
			});
			if (!response.ok)
				return null;
			const allFriends = await response.json();
			return allFriends.find((friend: any) => friend.id === this.options.id) ?? null;
		} catch (err) {
			logError('Error refreshing friend status');
			return null;
		}
	}
}