import { logError, logInfo } from "../utils/logger";

export interface userListCardOptions {
	id: string,
	avatar: string;
	username: string;
	nickname: string;
}

export class UserListCard {
	element: HTMLElement;
	constructor(options: userListCardOptions){
		const wrapper = document.createElement('div');
		wrapper.className = 'UserListCard'

		wrapper.innerHTML = `
			<div class="flex justify-between">
				<div class="flex justify-start gap-8 mb-2">
					<img src="${options.avatar}" alt="avatar" class="w-10 h-10 object-cover" />
					<div class=" flex flex-col text-start">	
						<span> username: ${options.username}</span>
						<span> nickname: ${options.nickname}</span>
					</div>
				</div>
				<button id="add-friend" class="btn-win98 block"> add to friend </button>
			</div>
			<hr class=" border-2 border-b-gray-200 border-t-gray-400 mb-4">
		`
		this.element = wrapper;

		/*wrapper.querySelector('#add-frind')?.addEventListener('click', async () =>{
			try{
				const token = localStorage.getItem('token')
				const response = await fetch(`/api/profile/addFriend/${options.id}`, {
					method: 'POST',
					headers: {
					'accept': 'application/json',
					'Authorization': `Bearer ${token}`
					}
				})
			}
			catch(err){
				logError(`impossible add $[]`)
			}
		})*/
	}
}