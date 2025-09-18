import { logInfo, logError } from "../utils/logger.js";
import { Win98Window } from "../components/Win98Window.js";
import { UserListCard } from "../components/usersListCard.js";
import { log } from "node:console";

export function Application2FA(userInfo: any, app: HTMLElement){
	const ApplicationButton = document.querySelector('#key-icon button');
	let show2FAWindows: Win98Window | null = null;

	ApplicationButton?.addEventListener('click', async () => {
		const { id, username, display_name, email, avatar, twofa_enabled} = userInfo;
		
		if (show2FAWindows) return 
		try {
			const rawHtml = await fetch ('/html/2FAWindos.html');
			const window = await rawHtml.text();
			const token = localStorage.getItem('token');
			
			show2FAWindows = new Win98Window({
				title: '2FA',
				content: window,
				onClose: () => {
					show2FAWindows = null;
				}
			});
			app.appendChild(show2FAWindows.element);
			
			const windowDiv = show2FAWindows.element.querySelector('#twofaWindow');
			const activateButton = show2FAWindows.element.querySelector('#activate');
			const nextButton = show2FAWindows?.element.querySelector('#next') as HTMLButtonElement
			const secondPage = show2FAWindows?.element.querySelector('#next-page')
			const form = show2FAWindows?.element.querySelector('#twofa-form') as HTMLFormElement
			const finish = show2FAWindows?.element.querySelector('#finish')

			if(twofa_enabled){
				if (windowDiv) {
					windowDiv.innerHTML = `<div class="text-center p-4">
					<p class="text-green-600 font-bold">✓ 2FA is already activated for user ${username}</p>
						<p class="text-sm mt-2">Your account is secured with two-factor authentication.</p>
					</div>`;
				}
				return;
			}
			activateButton?.addEventListener('click', async () =>{
				try{
					const qrCodeResponse = await fetch('/api/profile/generate2FA', {
						method: 'GET',
						headers: {
							'Authorization': `Bearer ${token}`,
						}
					});
					if(qrCodeResponse.status === 200){
						activateButton.textContent = 'new qrCode'
						const data = await qrCodeResponse.json();
						const qrDiv = show2FAWindows?.element.querySelector('#qr-code')
						if (qrDiv && data.qrCode) {
							qrDiv.innerHTML = `<img src="${data.qrCode}" alt="2FA QR Code" class="mx-auto border" />`;
						}
						if(nextButton)
							nextButton.classList.remove('hidden');
						nextButton?.addEventListener('click', () => {
							if(secondPage && windowDiv){
								secondPage.classList.remove('hidden');
								windowDiv.classList.add('hidden');
							}
						})

					}
				}
				catch(err){
					logError('an error occure trying to activate 2FA');
				}
			})
			form.addEventListener('submit', async (e) => {
				e.preventDefault();
				const otp = (show2FAWindows!.element.querySelector('#code') as HTMLInputElement).value.trim();
				try {
					const response = await fetch('/api/profile/verify2FA', {
						method: 'POST',
						headers:{
							'Authorization': `Bearer ${token}`, 
							'Content-Type' : 'application/json'
						},
						body: JSON.stringify({token: otp})
					})
					if(response.status === 200){
						logInfo(`${username} had activated 2FA autentication`);
						if(finish && secondPage && windowDiv){
							finish.classList.remove('hidden');
							secondPage.classList.add('hidden');
							windowDiv.classList.add('hidden');
						}
					}
					else if(response.status === 401)
						logError('an error occurred trying to verify OTP code')
				}catch(err){
					logError('an error occurred trying to verify OTP code')
				}

			})
		}
		catch(err){
			logError('error creating 2FA windows', err as any);
		}
	})
}