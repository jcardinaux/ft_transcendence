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
		let flag = false

		try {
			const responseFriend = await fetch('/api/profile/getFriends', {
				method: 'GET',
				headers: {
					'accept': 'application/json',
					'Authorization': `Bearer ${token}`
				}
			});
			const allFriends = await responseFriend.json();
			if (allFriends.find((friend: any) => friend.id === this.options.id)) {
				flag = true;
				button.textContent = 'delate friend';
			}
			button.addEventListener('click', async () => {
				if (!flag){

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
							flag = true;
							button.textContent = 'delate friend';
						} else {
							const errorMsg = await response.text();
							logError(`Error adding friend: ${errorMsg}`);
						}
					} catch (err) {
						logError(`impossible add ${this.options.username} as friend`);
					}
				}
				else {
					try{
						const response = await fetch(`/api/profile/deleteFriend/${this.options.id}`, {
							method: 'DELETE',
							headers: {
								'accept': 'application/json',
								'Authorization': `Bearer ${token}`
							},
							body: ''
						})
						if (response.status === 200){
							logInfo(`Successfully removed friend ${this.options.username}`)
							flag = false;
							button.textContent = ' add to friend'
						}
						else {
							const errorMsg = await response.text();
							logError(`Error adding friend: ${errorMsg}`);
						}
					}
					catch (err) {
						logError(`impossible remove ${this.options.username} from friend`);
					}
				}
			});

		} catch (err) {
			logError('Error checking friend status');
		}
	}
}