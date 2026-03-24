// authService.js
export const setRememberMePreference = (email, remember) => {
  if (remember) {
    localStorage.setItem('rememberedEmail', email);
  } else {
    localStorage.removeItem('rememberedEmail');
  }
};

export const getRememberedEmail = () => {
  return localStorage.getItem('rememberedEmail') || '';
};

export const clearRememberedEmail = () => {
  localStorage.removeItem('rememberedEmail');
};

export const setAuthToken = (token, remember) => {
  if (remember) {
    localStorage.setItem('authToken', token);
  } else {
    sessionStorage.setItem('authToken', token);
  }
};

export const getAuthToken = () => {
  return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
};