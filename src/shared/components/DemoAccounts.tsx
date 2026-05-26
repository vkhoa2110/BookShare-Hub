import { demoAccounts } from '../constants/rules'

export function DemoAccounts({
  accounts,
  onUse,
}: {
  accounts: typeof demoAccounts
  onUse: (email: string, password: string) => void
}) {
  return (
    <div className="demo-accounts">
      <div className="demo-accounts-header">
        <strong>Tài khoản demo</strong>
        <span>Mật khẩu: Bookshare123!</span>
      </div>
      <div className="demo-account-grid">
        {accounts.map((account) => (
          <button
            key={account.email}
            type="button"
            className="demo-account-button"
            onClick={() => onUse(account.email, account.password)}
          >
            <span>{account.label}</span>
            <strong>{account.email}</strong>
          </button>
        ))}
      </div>
    </div>
  )
}
