import SignUpPage from './SignUpPage';
import { render, screen, waitFor, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { rest } from 'msw';
import { eventWrapper } from '@testing-library/user-event/dist/utils';

describe('Sign up page', () => {
	describe('layout', () => {
		it('has header', () => {
			render(<SignUpPage />);
			const header = screen.queryByRole('heading', { name: 'Sign Up' });
			expect(header).toBeInTheDocument();
		});
		it('has username input', () => {
			render(<SignUpPage />);
			const input = screen.getByLabelText('Username');
			expect(input).toBeInTheDocument();
		});
		it('has email input', () => {
			render(<SignUpPage />);
			const input = screen.getByLabelText('Email');
			expect(input).toBeInTheDocument();
		});
		it('has password input', () => {
			render(<SignUpPage />);
			const input = screen.getByLabelText('Password');
			expect(input).toBeInTheDocument();
		});
		it('has password type for password input', () => {
			render(<SignUpPage />);
			const input = screen.getByLabelText('Password');
			expect(input.type).toBe('password');
		});
		it('has password repeat input', () => {
			render(<SignUpPage />);
			const input = screen.getByLabelText('Password Repeat');
			expect(input).toBeInTheDocument();
		});
		it('has password type for password repeat input', () => {
			render(<SignUpPage />);
			const input = screen.getByLabelText('Password Repeat');
			expect(input.type).toBe('password');
		});
		it('has sign up button', () => {
			render(<SignUpPage />);
			const button = screen.queryByRole('button', { name: 'Sign Up' });
			expect(button).toBeInTheDocument();
		});
		it('disables the button initially', () => {
			render(<SignUpPage />);
			const button = screen.queryByRole('button', { name: 'Sign Up' });
			expect(button).toBeDisabled();
		});
	});
	describe('interactions', () => {
		let requestBody;
		let counter = 0;
		const server = setupServer(
			rest.post('/api/1.0/users', (req, res, context) => {
				requestBody = req.body;
				counter += 1;
				return res(context.status(200));
			})
		);

		beforeEach(() => {
			counter = 0;
			server.resetHandlers();
		});

		beforeAll(() => server.listen());

		afterAll(() => server.close());

		let button;
		const setup = () => {
			render(<SignUpPage />);

			const usernameInput = screen.getByLabelText('Username');
			const emailInput = screen.getByLabelText('Email');
			const passwordInput = screen.getByLabelText('Password');
			const passwordRepeatInput = screen.getByLabelText('Password Repeat');
			button = screen.queryByRole('button', { name: 'Sign Up' });

			userEvent.type(usernameInput, 'User1');
			userEvent.type(emailInput, 'user1@mail.com');
			userEvent.type(passwordInput, 'Password');
			userEvent.type(passwordRepeatInput, 'Password');
		};

		it('enables the button when password and password repeat fields have the same value', () => {
			setup();

			expect(button).toBeEnabled();
		});
		it('sends username, email, and password to backend after clicking button', async () => {
			server.listen();
			setup();

			userEvent.click(button);

			await screen.findByText('Please check your email to activate your account.');

			expect(requestBody).toEqual({
				username: 'User1',
				email: 'user1@mail.com',
				password: 'Password'
			});
		});
		it('disables button when there is an ongoing api call', async () => {
			setup();

			userEvent.click(button);
			userEvent.click(button);

			await screen.findByText('Please check your email to activate your account.');

			expect(counter).toBe(1);
		});
		it('displays spinner after clicking submit', async () => {
			setup();
			expect(screen.queryByRole('status')).not.toBeInTheDocument();

			userEvent.click(button);
			const spinner = screen.getByRole('status');
			expect(spinner).toBeInTheDocument();
			await screen.findByText('Please check your email to activate your account.');
		});
		it('displays account activation notification after successful sign up request', async () => {
			setup();
			const message = 'Please check your email to activate your account.';

			expect(screen.queryByText(message)).not.toBeInTheDocument();

			userEvent.click(button);

			const text = await screen.findByText(message);

			expect(text).toBeInTheDocument();
		});
		it('hides sign up form after successful request', async () => {
			setup();

			const form = screen.getByTestId('form-sign-up');

			userEvent.click(button);

			await waitFor(() => {
				expect(form).not.toBeInTheDocument();
			});
		});

		const generateValidationError = (field, message) => {
			return rest.post('/api/1.0/users', (req, res, context) => {
				return res(
					context.status(400),
					context.json({
						validationErrors: {
							[field]: message
						}
					})
				);
			});
		};

		it.each`
			field               | message
			${'username'}       | ${'Username cannot be null'}
			${'email'}          | ${'Email cannot be null'}
			${'password'}       | ${'Password cannot be null'}
			${'passwordRepeat'} | ${'Password Repeat cannot be null'}
		`('display $message for $field', async ({ field, message }) => {
			server.use(generateValidationError(field, message));
			setup();
			userEvent.click(button);
			const validationError = await screen.findByText(message);

			expect(validationError).toBeInTheDocument();
		});
		it('it hides spinner and enables button after response received', async () => {
			server.use(generateValidationError('username', 'Username cannot be null'));
			setup();
			userEvent.click(button);
			await screen.findByText('Username cannot be null');

			expect(screen.queryByRole('status')).not.toBeInTheDocument();

			expect(button).toBeEnabled();
		});
	});
});
