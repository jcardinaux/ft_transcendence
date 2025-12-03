import { logError, logInfo } from './logger.js';

type PresencePayload = {
	type: 'presence';
	userId: number;
	status: 'online' | 'offline';
	timestamp: string;
};

type FriendshipPayload = {
	type: 'friendship';
	userId: number;
	friendId: number;
	action: 'added' | 'removed';
	timestamp: string;
};

type SocketPayload = PresencePayload | FriendshipPayload;

type FriendsRefreshDetail =
	| { kind: 'presence'; data: PresencePayload }
	| { kind: 'friendship'; data: FriendshipPayload };

export function startPresenceSocket(token: string | null) {
	if (!token) {
		return () => undefined;
	}

	let socket: WebSocket | null = null;
	let reconnectTimer: number | undefined;

	const dispatchRefresh = (detail?: FriendsRefreshDetail) => {
		window.dispatchEvent(new CustomEvent('friends-refresh', { detail }));
	};

	const connect = () => {
		const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
		const url = `${protocol}://${window.location.host}/ws/${token}`;
		socket = new WebSocket(url);

		socket.addEventListener('open', () => {
			logInfo('Presence socket connected');
		});

		socket.addEventListener('message', (event) => {
			try {
				const payload = JSON.parse(event.data) as SocketPayload;
				if (payload?.type === 'presence') {
					dispatchRefresh({ kind: 'presence', data: payload });
				} else if (payload?.type === 'friendship') {
					dispatchRefresh({ kind: 'friendship', data: payload });
				}
			} catch (error) {
				logError('Invalid payload received from presence socket', error as {} | undefined);
			}
		});

		socket.addEventListener('close', () => {
			dispatchRefresh();
			reconnectTimer = window.setTimeout(connect, 5000);
		});

		socket.addEventListener('error', (error) => {
			logError('Presence socket error', error as {} | undefined);
			socket?.close();
		});
	};

	connect();

	return () => {
		if (reconnectTimer) {
			window.clearTimeout(reconnectTimer);
		}
		if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
			socket.close();
		}
	};
}
