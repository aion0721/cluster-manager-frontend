import type { FormEvent as FormEventType } from 'react'
import { useState } from 'react'
import {
  getConnectionGuide,
  getKubectlSetupCommand,
  getMe,
  issueToken,
} from '../api/me'
import type {
  ConnectionGuide,
  CurrentUserResponse,
  KubectlSetupCommandResponse,
  ServiceAccountTokenResponse,
} from '../types/me'

const userIdPattern = /^[a-z0-9]([-a-z0-9]*[a-z0-9])?$/

type CopyTarget = 'portForward' | 'powershell' | 'bash' | 'token' | ''

export function UserConnectionGuide() {
  const [userId, setUserId] = useState('')
  const [currentUser, setCurrentUser] = useState<CurrentUserResponse>()
  const [connectionGuide, setConnectionGuide] = useState<ConnectionGuide>()
  const [kubectlSetup, setKubectlSetup] = useState<KubectlSetupCommandResponse>()
  const [tokenResponse, setTokenResponse] = useState<ServiceAccountTokenResponse>()
  const [showTokenPanel, setShowTokenPanel] = useState(false)
  const [loadingGuide, setLoadingGuide] = useState(false)
  const [loadingSetup, setLoadingSetup] = useState(false)
  const [loadingToken, setLoadingToken] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState<CopyTarget>('')

  function validateUserId() {
    const normalizedUserId = userId.trim()
    if (!userIdPattern.test(normalizedUserId)) {
      throw new Error('userId must match ^[a-z0-9]([-a-z0-9]*[a-z0-9])?$.')
    }

    return normalizedUserId
  }

  async function loadConnectionGuide(event?: FormEventType<HTMLFormElement>) {
    event?.preventDefault()
    setLoadingGuide(true)
    setError('')
    setCopied('')
    setKubectlSetup(undefined)
    setTokenResponse(undefined)

    try {
      const normalizedUserId = validateUserId()
      const [meResponse, guideResponse] = await Promise.all([
        getMe(normalizedUserId),
        getConnectionGuide(normalizedUserId),
      ])
      setCurrentUser(meResponse)
      setConnectionGuide(guideResponse)
    } catch (caught) {
      setCurrentUser(undefined)
      setConnectionGuide(undefined)
      setError(caught instanceof Error ? caught.message : 'Failed to load connection guide.')
    } finally {
      setLoadingGuide(false)
    }
  }

  async function handleKubectlSetup() {
    setLoadingSetup(true)
    setError('')
    setCopied('')

    try {
      const normalizedUserId = validateUserId()
      const response = await getKubectlSetupCommand(normalizedUserId)
      setKubectlSetup(response)
    } catch (caught) {
      setKubectlSetup(undefined)
      setError(caught instanceof Error ? caught.message : 'Failed to generate kubectl setup command.')
    } finally {
      setLoadingSetup(false)
    }
  }

  async function handleIssueToken() {
    setLoadingToken(true)
    setError('')
    setCopied('')

    try {
      const normalizedUserId = validateUserId()
      const response = await issueToken(normalizedUserId)
      setTokenResponse(response)
    } catch (caught) {
      setTokenResponse(undefined)
      setError(caught instanceof Error ? caught.message : 'Failed to issue token.')
    } finally {
      setLoadingToken(false)
    }
  }

  async function copyText(value: string, target: CopyTarget) {
    await navigator.clipboard.writeText(value)
    setCopied(target)
  }

  return (
    <section className="card connection-guide-card">
      <div className="section-heading">
        <p className="eyebrow">User Connection Guide</p>
        <h2>接続ガイド</h2>
        <p>
          MVP用の簡易ユーザー指定です。認証ではありません。Backend へは
          `X-User-Id` ヘッダーを付けて API を呼び出します。
        </p>
      </div>

      <form className="connection-form" onSubmit={loadConnectionGuide}>
        <label>
          <span>X-User-Id</span>
          <input
            value={userId}
            onChange={(event) => {
              setUserId(event.target.value)
              setError('')
            }}
            placeholder="koba"
            autoComplete="off"
          />
        </label>
        <button type="submit" className="primary-button" disabled={loadingGuide}>
          {loadingGuide ? '取得中' : '自分の接続情報を取得'}
        </button>
      </form>

      {error ? <p className="error-banner">{error}</p> : null}

      <div className="connection-sections">
        <section className="sub-panel">
          <div className="section-heading">
            <h2>環境情報</h2>
          </div>
          <dl className="detail-grid">
            <div>
              <dt>userId</dt>
              <dd>{currentUser?.userId ?? '-'}</dd>
            </div>
            <div>
              <dt>Namespace</dt>
              <dd>{currentUser?.namespace ?? '-'}</dd>
            </div>
            <div>
              <dt>ServiceAccount</dt>
              <dd>{currentUser?.serviceAccount ?? '-'}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <span className="status-pill">{currentUser?.status ?? currentUser?.phase ?? '-'}</span>
              </dd>
            </div>
          </dl>
        </section>

        <section className="sub-panel">
          <div className="section-heading split-heading">
            <div>
              <h2>port-forward command</h2>
              <p>Frontend/Backend では実行しません。利用者のローカル端末で実行してください。</p>
            </div>
            <button
              type="button"
              className="secondary-button"
              onClick={() =>
                connectionGuide?.portForwardCommand &&
                copyText(connectionGuide.portForwardCommand, 'portForward')
              }
              disabled={!connectionGuide?.portForwardCommand}
            >
              {copied === 'portForward' ? 'コピーしました' : 'コピー'}
            </button>
          </div>
          <dl className="detail-grid compact-detail">
            <div>
              <dt>Namespace</dt>
              <dd>{connectionGuide?.namespace ?? '-'}</dd>
            </div>
            <div>
              <dt>ServiceAccount</dt>
              <dd>{connectionGuide?.serviceAccount ?? '-'}</dd>
            </div>
          </dl>
          <pre className="command-box">
            {connectionGuide?.portForwardCommand ?? '接続情報を取得すると表示されます。'}
          </pre>
        </section>

        <section className="sub-panel">
          <div className="section-heading split-heading">
            <div>
              <h2>kubectl setup command</h2>
              <p>token は短命であり、localStorage/sessionStorage には保存されません。</p>
            </div>
            <button
              type="button"
              className="primary-button"
              onClick={handleKubectlSetup}
              disabled={loadingSetup}
            >
              {loadingSetup ? '生成中' : 'kubectl設定コマンドを生成'}
            </button>
          </div>

          {kubectlSetup ? (
            <div className="setup-output">
              <dl className="detail-grid compact-detail">
                <div>
                  <dt>Cluster</dt>
                  <dd>{kubectlSetup.clusterName}</dd>
                </div>
                <div>
                  <dt>Context</dt>
                  <dd>{kubectlSetup.contextName}</dd>
                </div>
                <div>
                  <dt>Credential</dt>
                  <dd>{kubectlSetup.credentialName}</dd>
                </div>
                <div>
                  <dt>ExpiresAt</dt>
                  <dd>{kubectlSetup.expiresAt}</dd>
                </div>
              </dl>

              <CommandBlock
                title="PowerShell"
                value={kubectlSetup.powershell}
                copied={copied === 'powershell'}
                onCopy={() => copyText(kubectlSetup.powershell, 'powershell')}
              />
              <CommandBlock
                title="bash"
                value={kubectlSetup.bash}
                copied={copied === 'bash'}
                onCopy={() => copyText(kubectlSetup.bash, 'bash')}
              />
            </div>
          ) : (
            <p className="muted-text">必要なときだけ POST で生成して表示します。</p>
          )}
        </section>

        <details className="sub-panel token-details" open={showTokenPanel}>
          <summary onClick={() => setShowTokenPanel((current) => !current)}>
            短命tokenを個別に表示
          </summary>
          <p className="muted-text">通常は kubectl setup command を使ってください。token は保存されません。</p>
          <button
            type="button"
            className="secondary-button"
            onClick={handleIssueToken}
            disabled={loadingToken}
          >
            {loadingToken ? '取得中' : '短命tokenを表示'}
          </button>

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
              <CommandBlock
                title="Token"
                value={tokenResponse.token}
                copied={copied === 'token'}
                onCopy={() => copyText(tokenResponse.token, 'token')}
              />
            </div>
          ) : null}
        </details>
      </div>
    </section>
  )
}

type CommandBlockProps = {
  title: string
  value: string
  copied: boolean
  onCopy: () => void
}

function CommandBlock({ title, value, copied, onCopy }: CommandBlockProps) {
  return (
    <div className="command-block">
      <div className="token-heading">
        <span>{title}</span>
        <button type="button" className="secondary-button" onClick={onCopy}>
          {copied ? 'コピーしました' : 'コピー'}
        </button>
      </div>
      <pre className="command-box">{value}</pre>
    </div>
  )
}
