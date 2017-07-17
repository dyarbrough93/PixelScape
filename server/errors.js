const formConfig = require('./config.js').server.loginForm

module.exports = {
	login: {
		E_BADCRED: {
			name: 'E_BADCRED',
			message: 'Username or password is incorrect.'
		},
		E_USERNOTFOUND: {
			name: 'E_USERNOTFOUND',
			message: 'Username or password is incorrect.'
		},
		E_BANNED: {
			name: 'E_BANNED',
			message: 'This account has been deactivated.'
		}
	},
	signup: {
		E_USEREXISTS: {
			name: 'E_USEREXISTS',
			message: 'User already exists.'
		},
		E_INVALIDUNAME: {
			name: 'E_INVALIDUNAME',
			message: 'Username must use only letters, numbers, and underscores and be less than ' + formConfig.lowMaxLength + ' characters.'
		},
		E_INVALIDPASSWORD: {
			name: 'E_INVALIDPASSWORD',
			message: 'Password must be between ' + formConfig.minLength + ' and ' + formConfig.lowMaxLength + ' characters.'
		}
	}
}
