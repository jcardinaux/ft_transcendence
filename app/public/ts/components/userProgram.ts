import { logInfo, logError } from "../utils/logger.js";
import { Win98Window } from "../components/Win98Window.js";

export function userApplication(userInfo: any, app: HTMLElement) {
  const userButton = document.querySelector('#user-icon button');
  let userWindow: Win98Window | null = null;

  userButton?.addEventListener('click', async () => {
    const { id, username, display_name, email, avatar } = userInfo;

    if (userWindow) return;

    try {
      const userRes = await fetch('/html/userWindow.html');
      const htmlUserWindow = await userRes.text();

      userWindow = new Win98Window({
        title: 'user',
        content: htmlUserWindow,
        onClose: () => {
          userWindow = null;
        }
      });

      app.appendChild(userWindow.element);
			const usernameElem = userWindow.element.querySelector('#username');
			if (usernameElem) {
				usernameElem.textContent = username;
			}
			const emailElem = userWindow.element.querySelector('#email');
			if (emailElem) {
				emailElem.textContent = email;
			}
			const displayNameElem = userWindow.element.querySelector('#display_name');
			if (displayNameElem) {
				displayNameElem.textContent = display_name;
			}
			const avatarElem = userWindow.element.querySelector('#avatar-image');
			if (avatarElem && avatar) {
				avatarElem.innerHTML = `<img src="${avatar}" alt="avatar" class="w-20 h-20 object-cover" />`;
			}
			const avatarBtn = (userWindow!.element.querySelector('#avatar-btn'));
			const usernameBtn = (userWindow!.element.querySelector('#username-btn'));
			const nicknameBtn = (userWindow!.element.querySelector('#nickname-btn'));
			const inputDiv = (userWindow!.element.querySelector('#inputDiv'));
			//gestione dell'upload dell'avatar
			avatarBtn?.addEventListener('click', async () => {
				if (inputDiv){
					inputDiv.innerHTML = `
						<form id="avatar-upload-form" class="flex justify-between">
							<input type="file" id="avatar-input" name="avatar" accept="image/*" class="block" />
							<button type="submit" id="avatar-upload-btn" class="btn-win98"> apply </button>
						</form>
					`;
					inputDiv.classList.remove('hidden');
					const avatarForm = userWindow!.element.querySelector('#avatar-upload-form') as HTMLFormElement;
					if(avatarForm){
						avatarForm.addEventListener('submit', async (e) => {
							e.preventDefault();
							const input = avatarForm.querySelector('#avatar-input') as HTMLInputElement;
							if (!input || !input.files) return;
							const file = input.files[0];
							const formData = new FormData();
							formData.append('avatar', file);
							const token = localStorage.getItem('token');
							try {
								const response = await fetch('/api/profile/uploadAvatar', {
									method: 'POST',
									headers: {'Authorization': `Bearer ${token}`},
									body: formData
								});
								if (response.status === 200){
									location.reload();
								}
								else {
									logError('error uploading avatar image')
								}
							}
							catch (err){
								logError('error uploading avatar image')
							}
						})
					}
				}
			})
			usernameBtn?.addEventListener('click', async () => {
				if (inputDiv){
					inputDiv.innerHTML = `
						<form id="username-upload" class="flex justify-between">
							<input type="text" id="input-username" placeholder="Username" class="input-win98" required/>
							<button type="submit" id="avatar-upload-btn" class="btn-win98"> apply </button>
						</form>
					`;
					inputDiv.classList.remove('hidden');
					const usernameForm = userWindow!.element.querySelector('#username-upload') as HTMLFormElement
					if(usernameForm){
						usernameForm.addEventListener('submit', async (e) => {
							e.preventDefault();
							const newUsername = (userWindow!.element.querySelector('#input-username') as HTMLInputElement).value.trim();
							const token = localStorage.getItem('token');
							try{
								const response = await fetch('/api/profile/changeUsername', {
									method: 'PUT',
									headers: {
										'Authorization': `Bearer ${token}`,
										'Content-Type': 'application/json'
									},
									body:JSON.stringify({username: newUsername})
								});
								if(response.status === 200){
									logInfo(`user ${id} name are now ${newUsername}`);
									location.reload();
								}
								else{
									const errorMsg = await response.text();
									logError(`Error changing username: ${errorMsg}`);
									inputDiv.innerHTML += `<div class="text-red-600 mt-4">${errorMsg}</div>`
								}
							}
							catch (err){
								logError('error calling api /api/profile/changeUsername')
							}
						})
					}
				}
			})
			nicknameBtn?.addEventListener('click', async () => {
				if (inputDiv){
					inputDiv.innerHTML = `
						<form id="nickname-upload" class="flex justify-between">
							<input type="text" placeholder="Nickname" id="nickname-input" class="input-win98" required/>
							<button type="submit" id="avatar-upload-btn" class="btn-win98"> apply </button>
						</form>
					`;
					inputDiv.classList.remove('hidden');
					const nickNameForm = userWindow!.element.querySelector('#nickname-upload') as HTMLFormElement;
					if (nickNameForm){
						nickNameForm.addEventListener('submit', async (e) =>{
							e.preventDefault();
							const newNickname = (userWindow!.element.querySelector('#nickname-input') as HTMLInputElement).value.trim();
							const token = localStorage.getItem('token');
							try{
								const response = await fetch('/api/profile/changeDisplayName', {
									method: 'PUT',
									headers: {
										'Authorization': `Bearer ${token}`,
										'Content-Type': 'application/json'
									},
									body:JSON.stringify({display_name: newNickname})
								})
								if(response.status === 200){
									logInfo(`user ${id} display-name are now ${newNickname}`);
									location.reload();
								}
								else{
									const errorMsg = await response.text();
									logError(`Error changing username: ${errorMsg}`);
									inputDiv.innerHTML += `<div class="text-red-600 mt-4">${errorMsg}</div>`
								}

							}
							catch(err){
								logError('error updating nickname')
							}
						})
					}
				}
			})
    } catch (err) {
      logError('Errore nella creazione della finestra utente', err as any);
    }
  });
}