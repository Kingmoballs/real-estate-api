import api from '../../lib/api.js'

export const requestPasswordReset = async (email) => {
  const response = await api.post(
    '/auth/forgot-password',
    { email },
    { skipAuthRefresh: true },
  )

  return response.data
}

export const resetPassword = async ({ token, newPassword }) => {
  const response = await api.post(
    '/auth/reset-password',
    { token, newPassword },
    { skipAuthRefresh: true },
  )

  return response.data
}

export const changePassword = async ({
  currentPassword,
  newPassword,
}) => {
  const response = await api.patch('/auth/change-password', {
    currentPassword,
    newPassword,
  })

  return response.data
}