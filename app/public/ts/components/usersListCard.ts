import { logError, logInfo } from "../utils/logger.js";

export interface userListCardOptions {
	id: string,
	avatar: string;
	username: string;
	nickname: string;
}

export class UserListCard {
	element: HTMLElement;
	private options: userListCardOptions;

	constructor(options: userListCardOptions) {
		this.options = options;
		const wrapper = document.createElement('div');
		wrapper.className = 'UserListCard';

		wrapper.innerHTML = `
			<div class="flex justify-between">
				<div class="flex justify-start gap-8 mb-2">
					<img src="${options.avatar}" alt="avatar" class="w-10 h-10 object-cover" />
					<div class=" flex flex-col text-start">	
						<span> username: ${options.username}</span>
						<span> nickname: ${options.nickname}</span>
						<span class="friend-status text-xs uppercase tracking-wide text-gray-500">status: not a friend</span>
						<span class="friend-last-seen text-xs text-gray-500">add to friend to monitor activity</span>
					</div>
				</div>
				<button class="btn-win98 add-friend-btn"> add to friend </button>
			</div>
			<hr class=" border-2 border-b-gray-200 border-t-gray-400 mb-4">
		`;

		this.element = wrapper;
	}

	async init() {
		const button = this.element.querySelector('.add-friend-btn') as HTMLButtonElement;
		const token = localStorage.getItem('token');
		let isFriend = false;

		if (!token) {
			logError('Missing token: cannot manage friends list');
			button.disabled = true;
			this.updateStatus();
			return;
		}

		const syncFriendState = async () => {
			const friendInfo = await this.fetchFriendInfo(token);
			if (friendInfo) {
				isFriend = true;
				button.textContent = 'delate friend';
				this.updateStatus(friendInfo);
			} else {
				isFriend = false;
				button.textContent = ' add to friend';
				this.updateStatus();
			}
		};

		await syncFriendState();

		button.addEventListener('click', async () => {
			button.disabled = true;
			try {
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
						} else {
							const errorMsg = await response.text();
							logError(`Error adding friend: ${errorMsg}`);
							return;
						}
					} catch (err) {
						logError(`impossible add ${this.options.username} as friend`);
						return;
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
						}
						else {
							const errorMsg = await response.text();
							logError(`Error adding friend: ${errorMsg}`);
							return;
						}
					}
					catch (err) {
						logError(`impossible remove ${this.options.username} from friend`);
						return;
					}
				}
				await syncFriendState();
			} finally {
				button.disabled = false;
			}
		});
	}

	private async fetchFriendInfo(token: string): Promise<any | null> {
		try {
			const responseFriend = await fetch('/api/profile/getFriends', {
				method: 'GET',
				headers: {
					'accept': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});
			if (!responseFriend.ok) return null;
			const allFriends = await responseFriend.json();
			const friendId = Number(this.options.id);
			return allFriends.find((friend: any) => Number(friend.id) === friendId) || null;
		} catch (err) {
			logError('Error checking friend status');
			return null;
		}
	}

	private updateStatus(friend?: { is_online?: number | boolean, last_seen?: string }) {
		const statusElem = this.element.querySelector('.friend-status') as HTMLElement | null;
		const lastSeenElem = this.element.querySelector('.friend-last-seen') as HTMLElement | null;

		if (!statusElem || !lastSeenElem) return;

		const setOnlineClasses = (isOnline: boolean) => {
			if (isOnline) {
				statusElem.classList.add('text-green-600');
				statusElem.classList.remove('text-gray-500');
				lastSeenElem.classList.add('text-green-600');
				lastSeenElem.classList.remove('text-gray-500');
			} else {
				statusElem.classList.remove('text-green-600');
				statusElem.classList.add('text-gray-500');
				lastSeenElem.classList.remove('text-green-600');
				lastSeenElem.classList.add('text-gray-500');
			}
		};

		if (!friend) {
			setOnlineClasses(false);
			statusElem.textContent = 'status: not a friend';
			lastSeenElem.textContent = 'add to friend to monitor activity';
			return;
		}

		const isOnline = friend.is_online === 1 || friend.is_online === '1' || friend.is_online === true;
		if (isOnline) {
			setOnlineClasses(true);
			statusElem.textContent = 'status: online';
			lastSeenElem.textContent = 'connected now';
		} else {
			setOnlineClasses(false);
			statusElem.textContent = 'status: offline';
			lastSeenElem.textContent = `last seen ${this.formatLastSeen(friend.last_seen)}`;
		}
	}

	private formatLastSeen(lastSeen?: string): string {
		if (!lastSeen) return 'recently';
		const parsed = new Date(lastSeen);
		if (Number.isNaN(parsed.getTime())) return lastSeen;

		const diffMs = Date.now() - parsed.getTime();
		const minutes = Math.floor(diffMs / 60000);
		if (minutes < 1) return 'just now';
		if (minutes < 60) return `${minutes}m ago`;
		const hours = Math.floor(minutes / 60);
		if (hours < 24) return `${hours}h ago`;
		const days = Math.floor(hours / 24);
		return `${days}d ago`;
	}
}