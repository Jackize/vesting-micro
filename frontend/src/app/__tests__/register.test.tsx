import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import RegisterPage from '../register/page';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import * as userQueries from '@/lib/react-query/queries/userQueries';

const mockUseRegister = userQueries.useRegister as jest.MockedFunction<
  typeof userQueries.useRegister
>;

// Mock the register hook
jest.mock('@/lib/react-query/queries/userQueries', () => ({
  ...jest.requireActual('@/lib/react-query/queries/userQueries'),
  useRegister: jest.fn(),
}));

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

describe('RegisterPage', () => {
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
    mockUseRegister.mockReturnValue({
      mutateAsync: mockMutateAsync,
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );

  it('renders register form', () => {
    render(<RegisterPage />, { wrapper });
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    mockMutateAsync.mockResolvedValue({ user: {}, token: 'test-token' });

    render(<RegisterPage />, { wrapper });

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith({
        firstName: 'John',
        lastName: 'Doe',
        email: 'test@example.com',
        password: 'Password123',
        phone: '',
      });
    });
  });

  it('displays error message on registration failure', async () => {
    const user = userEvent.setup();
    const errorMessage = 'User with this email already exists';
    mockMutateAsync.mockRejectedValue(new Error(errorMessage));

    render(<RegisterPage />, { wrapper });

    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/email address/i), 'existing@example.com');
    await user.type(screen.getByLabelText(/password/i), 'Password123');
    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(
      () => {
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      },
      { timeout: 3000 }
    );
  });
});
