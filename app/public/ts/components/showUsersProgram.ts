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
			const token = localStorage.getItem('token');
			const showUserRes = await fetch('/html/showUserWindow.html');
			const showUserHtml = await showUserRes.text();

			const allUsersResponse = await fetch('/api/auth/users', {
				method: 'GET',
				headers: {
					'accept': 'application/json'
				}
			});
			const allUsers = await allUsersResponse.json();

			const renderUsersList = async () => {
				if (!showUserWindow) return;
				let friends: any[] = [];
				if (token) {
					try {
						const friendsResponse = await fetch(`/api/profile/getFriends?ts=${Date.now()}`, {
							method: 'GET',
							headers: {
								'accept': 'application/json',
								'Authorization': `Bearer ${token}`
							},
							cache: 'no-store'
						});
						if (friendsResponse.ok) {
							friends = await friendsResponse.json();
						}
					} catch (err) {
						logError('error retrieving friends list');
					}
				}

				const usersListDiv = showUserWindow.element.querySelector('#users-list');
				if (usersListDiv && Array.isArray(allUsers)) {
					usersListDiv.innerHTML = '';
					for (const user of allUsers) {
						if(user.id != id){
							const friendInfo = friends.find((friend: any) => friend.id === user.id);
							const card = new UserListCard({
								id: user.id,
								avatar: user.avatar,
								username: user.username,
								nickname: user.display_name || '',
								isFriend: Boolean(friendInfo),
								isOnline: friendInfo ? Boolean(friendInfo.is_online) : false,
								lastSeen: friendInfo?.last_seen
							});
							await card.init();
							usersListDiv.appendChild(card.element);
						}
					}
				}
			};

			const refreshHandler = () => {
				void renderUsersList();
			};

			showUserWindow = new Win98Window({
				title: 'users list',
				content: showUserHtml,
				onClose: () => {
					showUserWindow = null;
					window.removeEventListener('friends-refresh', refreshHandler);
				}
			});
			app.appendChild(showUserWindow.element);
			window.addEventListener('friends-refresh', refreshHandler);
			await renderUsersList();
		}
		catch(err){
			logError('error loadin showUserWindow.html')
		}
	})
}