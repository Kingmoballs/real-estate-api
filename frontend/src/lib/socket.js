import { io } from 'socket.io-client'

const apiBaseUrl =
  import.meta.env.VITE_API_BASE_URL ||
  'http://localhost:5000/api'

const inferredSocketUrl = apiBaseUrl.replace(
  /\/api\/?$/,
  '',
)

const socketUrl = (
  import.meta.env.VITE_SOCKET_URL ||
  inferredSocketUrl
).replace(/\/$/, '')

let notificationSocket = null

export const getNotificationSocket = () => {
  if (!notificationSocket) {
    notificationSocket = io(socketUrl, {
      autoConnect: false,
      withCredentials: true,
    })
  }

  return notificationSocket
}