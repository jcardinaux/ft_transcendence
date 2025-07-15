export interface userListCardOptions {
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
			<div class="flex justify-start gap-8 mb-2">
				<img src="${options.avatar}" alt="avatar" class="w-10 h-10 object-cover" />
				<div class=" flex flex-col text-start">	
					<span> username: ${options.username}</span>
					<span> nickname: ${options.nickname}</span>
				</div>
			</div>
			<hr class=" border-2 border-b-gray-200 border-t-gray-400 mb-4">
		`
		this.element = wrapper;
	}
}