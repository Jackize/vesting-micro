import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginPage from '../login/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as userQueries from '@/lib/react-query/queries/userQueries';

const mockUseLogin = userQueries.useLogin as jest.MockedFunction<typeof userQueries.useLogin>;

// Mock the login hook
jest.mock('@/lib/react-query/queries/userQueries', () => ({
  ...jest.requireActual('@/lib/react-query/queries/userQueries'),
  useLogin: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('LoginPage', () => {
  let queryClient: QueryClient;
  let mockMutateAsync: jest.Mock;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
    mockMutateAsync = jest.fn();
    mockUseLogin.mockReturnValue({
      mutateAsync: mockMutateAsync,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders login form', () => {
    render(<LoginPage />, { wrapper });
    expect(screen.getByText(/sign in to your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('shows validation errors for empty fields', async () => {
    const user = userEvent.setup();
    render(<LoginPage />, { wrapper });

    const submitButton = screen.getByRole('button', { name: /sign in/i });
    await user.click(submitButton);

    await waitFor(
      () => {
        expect(screen.getByText(/please provide a valid email address/i)).toBeInTheDocument();
        expect(screen.getByText(/password is required/i)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ user: {}, token: 'test-token' });

    render(<LoginPage />, { wrapper });

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('displays error message on login failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'Invalid email or password';
    mockMutateAsync.mockRejectedValue(new Error(errorMessage));

    render(<LoginPage />, { wrapper });

    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(
      () => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
