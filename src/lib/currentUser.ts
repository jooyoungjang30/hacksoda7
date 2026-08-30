/**
 * No auth. `?as=priya` switches user and sticks; a header dropdown does the same.
 * The Slack deep link carries `as=`, so the button lands as the right person.
 */
const KEY = 'kudos.currentUser'

export function resolveCurrentUser(): string {
  const fromUrl = new URLSearchParams(window.location.search).get('as')
  if (fromUrl) {
    localStorage.setItem(KEY, fromUrl)
    return fromUrl
  }
  return localStorage.getItem(KEY) ?? 'wei'
}

export function setCurrentUser(id: string) {
  localStorage.setItem(KEY, id)
  window.location.href = '/me/send'
}
