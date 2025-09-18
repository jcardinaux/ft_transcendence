import { logInfo, logError } from "../utils/logger.js";
import { Win98Window } from "../components/Win98Window.js";
import { UserListCard } from "../components/usersListCard.js";

export function showUserApllication(userInfo: any, app: HTMLElement){
	const showUserButton = document.querySelector('#allUser-icon button');
	let showUserWindow: Win98Window | null = null;

	//attivazione bottone
	showUserButton?.addEventListener('click', async () =>{
		const {id} = userInfo;
		if (showUserWindow) return;

		try{
			const showUserRes = await fetch('/html/showUserWindow.html');
			const showUserHtml = await showUserRes.text();

			showUserWindow = new Win98Window({
				title: 'users list',
				content: showUserHtml,
				onClose: () => {
					showUserWindow = null;
				}
			});
			app.appendChild(showUserWindow.element);
			const response = await fetch('/api/auth/users', {
				method: 'GET',
				headers: {
					'accept': 'application/json'
				}
			})
			const allUsers = await response.json();
			const usersListDiv = showUserWindow.element.querySelector('#users-list');
			if (usersListDiv && Array.isArray(allUsers)) {
				usersListDiv.innerHTML = '';
				for (const user of allUsers) {
					if(user.id != id){
						const card = new UserListCard({
							id: user.id,
							avatar: user.avatar,
							username: user.username,
							nickname: user.display_name || ''
						});
						await card.init();
						usersListDiv.appendChild(card.element);
					}
				}
			}
		}
		catch(err){
			logError('error loadin showUserWindow.html')
		}
	})
}