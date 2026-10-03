import AIInsights from '../components/AIInsights'

export default function Insights() {
  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Insights</h1>
          <p className="page-subtitle">
            Read from your own transactions — nothing leaves your account.
          </p>
        </div>
      </div>

      <AIInsights />
    </div>
  )
}