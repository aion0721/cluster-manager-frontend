import { useEffect, useState } from 'react'
import { getConnectionGuide, getMe, issueToken } from '../api/me'
import type {
  ConnectionGuideResponse,
  MeResponse,
  ServiceAccountTokenResponse,
} from '../types/me'

type UserDashboardPageProps = {
  userId: string
  onChangeUser: () => void
}

export function UserDashboardPage({ userId, onChangeUser }: UserDashboardPageProps) {
  const [me, setMe] = useState<MeResponse>()
  const [guide, setGuide] = useState<ConnectionGuideResponse>()
  const [tokenResponse, setTokenResponse] = useState<ServiceAccountTokenResponse>()
  const [loading, setLoading] = useState(true)
  const [tokenLoading, setTokenLoading] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<'portForward' | 'token' | ''>('')

  async function loadDashboard() {
    setLoading(true)
    setError('')

    try {
      const [meResponse, guideResponse] = await Promise.all([
        getMe(userId),
        getConnectionGuide(userId),
      ])
      setMe(meResponse)
      setGuide(guideResponse)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to load dashboard.')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateToken() {
    setTokenLoading(true)
    setError('')
    setCopied('')

    try {
      const response = await issueToken(userId)
      setTokenResponse(response)
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Failed to create token.')
    } finally {
      setTokenLoading(false)
    }
  }

  async function copyText(value: string, target: 'portForward' | 'token') {
    await navigator.clipboard.writeText(value)
    setCopied(target)
  }

  useEffect(() => {
    void loadDashboard()
  }, [])

  return (
    <div className="user-dashboard">
      <section className="notice-card">
        <div>
          <strong>簡易ユーザー指定で利用中です。</strong>
          <p>
            認証機能はまだありません。Backend API には localStorage の userId を
            `X-User-Id` ヘッダーとして送信します。
          </p>
        </div>
        <button type="button" className="secondary-button" onClick={onChangeUser}>
          ユーザーIDを変更
        </button>
      </section>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="dashboard-grid mvp-grid">
        <section className="card">
          <div className="section-heading split-heading">
            <div>
              <h2>環境状態</h2>
              <p>{loading ? 'Loading...' : userId}</p>
            </div>
            <button type="button" className="secondary-button" onClick={loadDashboard} disabled={loading}>
              更新
            </button>
          </div>

          <dl className="detail-grid">
            <div>
              <dt>Namespace</dt>
              <dd>{me?.namespace ?? '-'}</dd>
            </div>
            <div>
              <dt>ServiceAccount</dt>
              <dd>{me?.serviceAccount ?? '-'}</dd>
            </div>
            <div>
              <dt>DevContainer</dt>
              <dd>{me?.deployment ?? '-'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-pill">{me?.status ?? me?.phase ?? '-'}</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="card">
          <div className="section-heading split-heading">
            <div>
              <h2>接続情報</h2>
              <p>port-forward はローカル端末で実行してください。</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() => guide?.portForwardCommand && copyText(guide.portForwardCommand, 'portForward')}
              disabled={!guide?.portForwardCommand}
            >
              {copied === 'portForward' ? 'Copied' : 'Copy'}
            </button>
          </div>

          <dl className="detail-grid compact-detail">
            <div>
              <dt>Namespace</dt>
              <dd>{guide?.namespace ?? '-'}</dd>
            </div>
            <div>
              <dt>ServiceAccount</dt>
              <dd>{guide?.serviceAccount ?? '-'}</dd>
            </div>
          </dl>

          {guide?.portForwardCommand ? (
            <pre className="command-box">{guide.portForwardCommand}</pre>
          ) : (
            <p className="muted-text">接続コマンドはまだ取得されていません。</p>
          )}
        </section>

        <section className="card token-card">
          <div className="section-heading split-heading">
            <div>
              <h2>Token発行</h2>
              <p>発行した token は保存しません。この画面上にのみ表示します。</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={handleCreateToken}
              disabled={tokenLoading}
            >
              {tokenLoading ? '発行中' : 'Tokenを発行'}
            </button>
          </div>

          {tokenResponse ? (
            <div className="token-result">
              <dl className="detail-grid compact-detail">
                <div>
                  <dt>Namespace</dt>
                  <dd>{tokenResponse.namespace}</dd>
                </div>
                <div>
                  <dt>ServiceAccount</dt>
                  <dd>{tokenResponse.serviceAccount}</dd>
                </div>
                <div>
                  <dt>ExpiresAt</dt>
                  <dd>{tokenResponse.expiresAt}</dd>
                </div>
              </dl>
              <div className="token-heading">
                <span>Token</span>
                <button
                  type="button"
                  className="secondary-button"
                  onClick={() => copyText(tokenResponse.token, 'token')}
                >
                  {copied === 'token' ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="command-box token-box">{tokenResponse.token}</pre>
            </div>
          ) : (
            <p className="muted-text">必要なときだけ token を発行してください。</p>
          )}
        </section>
      </div>
    </div>
  )
}
