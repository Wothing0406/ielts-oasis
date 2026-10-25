// This integration only accepts the game route; never redirect to arbitrary input.
export function rememberMeowchaReturn() {
  const requested = new URLSearchParams(window.location.search).get('returnTo');
  if (requested === '/games/meowcha') sessionStorage.setItem('oasis_return_to', requested);
}
export function consumeMeowchaReturn() {
  const target = sessionStorage.getItem('oasis_return_to');
  sessionStorage.removeItem('oasis_return_to');
  return target === '/games/meowcha' ? target : null;
}
