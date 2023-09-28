import { Component } from 'react';
import { act } from 'react-dom/test-utils';
import axios from 'axios';
import Input from '../components/Input';

class SignUpPage extends Component {
	state = {
		username: '',
		email: '',
		password: '',
		passwordRepeat: '',
		apiProgress: false,
		signUpSuccess: false,
		errors: {}
	};

	onChange = (e) => {
		const { value, id } = e.target;

		act(() => {
			this.setState({
				[id]: value
			});
		});
	};

	submit = async (e) => {
		e.preventDefault();
		const { username, email, password } = this.state;
		const body = { username, email, password };

		act(() => {
			this.setState({ apiProgress: true });
		});

		try {
			await axios.post('/api/1.0/users', body);
			act(() => {
				this.setState({
					signUpSuccess: true
				});
			});
		} catch (err) {
			if (err.response.status === 400) {
				act(() => {
					this.setState({
						errors: err.response.data.validationErrors
					});
					this.setState({ apiProgress: false });
				});
			}
		}
	};

	render() {
		let disabled = true;
		const { password, passwordRepeat, apiProgress, signUpSuccess, errors } = this.state;
		if (password && passwordRepeat) {
			disabled = password !== passwordRepeat;
		}
		return (
			<div className='col-lg-6 offset-lg-3 col-md-8 offset-md-2'>
				{!signUpSuccess && (
					<form className='card mt-5' data-testid='form-sign-up'>
						<div className='card-header'>
							<h1 className='text-center'>Sign Up</h1>
						</div>
						<div className='card-body'>
							<Input
								id={'username'}
								label={'Username'}
								onChange={this.onChange}
								help={errors.username}
							/>
							<Input
								id={'email'}
								label={'Email'}
								onChange={this.onChange}
								help={errors.email}
							/>
							<Input
								id={'password'}
								label={'Password'}
								onChange={this.onChange}
								help={errors.password}
								type='password'
							/>
							<Input
								id={'passwordRepeat'}
								label={'Password Repeat'}
								onChange={this.onChange}
								help={errors.passwordRepeat}
								type='password'
							/>

							<div className='text-center'>
								<button
									className='btn btn-success'
									onClick={this.submit}
									disabled={disabled || apiProgress}
								>
									{apiProgress && (
										<span
											className='spinner-border spinner-border-sm'
											role='status'
										></span>
									)}
									Sign Up
								</button>
							</div>
						</div>
					</form>
				)}

				{signUpSuccess && (
					<div className='alert alert-success mt-3'>
						Please check your email to activate your account.
					</div>
				)}
			</div>
		);
	}
}

export default SignUpPage;
