import { useState } from 'react'
import type { ChangeEvent } from 'react'
import type { CreateUserRequest } from '../types/user'

type UserCsvCreateFormProps = {
  disabled?: boolean
  onCreateMany: (requests: CreateUserRequest[]) => Promise<void>
}

type CsvPreviewRow = CreateUserRequest & {
  rowNumber: number
}

const userIdHeaderNames = new Set(['userid', 'user_id', 'user id', 'ユーザーid', 'ユーザid'])
const displayNameHeaderNames = new Set(['displayname', 'display_name', 'display name', 'name', '名前', '表示名'])

function parseCsvLine(line: string) {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index]
    const nextCharacter = line[index + 1]

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"'
      index += 1
    } else if (character === '"') {
      inQuotes = !inQuotes
    } else if (character === ',' && !inQuotes) {
      values.push(current.trim())
      current = ''
    } else {
      current += character
    }
  }

  values.push(current.trim())
  return values
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/^\ufeff/, '')
}

function parseUsersCsv(csvText: string) {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)

  if (lines.length === 0) {
    throw new Error('CSVファイルが空です。')
  }

  const firstRow = parseCsvLine(lines[0]).map(normalizeHeader)
  const userIdIndex = firstRow.findIndex((header) => userIdHeaderNames.has(header))
  const displayNameIndex = firstRow.findIndex((header) => displayNameHeaderNames.has(header))
  const hasHeader = userIdIndex >= 0
  const rows = hasHeader ? lines.slice(1) : lines
  const parsedRows = rows.map((line, index) => {
    const values = parseCsvLine(line)
    const rowNumber = index + (hasHeader ? 2 : 1)
    const userId = values[hasHeader ? userIdIndex : 0]?.trim() ?? ''
    const displayName = values[hasHeader && displayNameIndex >= 0 ? displayNameIndex : 1]?.trim() ?? ''

    if (!userId) {
      throw new Error(`${rowNumber}行目: userIdは必須です。`)
    }

    return { rowNumber, userId, displayName }
  })

  const duplicatedUserIds = parsedRows
    .map((row) => row.userId)
    .filter((userId, index, userIds) => userIds.indexOf(userId) !== index)

  if (duplicatedUserIds.length > 0) {
    throw new Error(`CSV内でuserIdが重複しています: ${Array.from(new Set(duplicatedUserIds)).join(', ')}`)
  }

  return parsedRows
}

export function UserCsvCreateForm({ disabled = false, onCreateMany }: UserCsvCreateFormProps) {
  const [fileName, setFileName] = useState('')
  const [previewRows, setPreviewRows] = useState<CsvPreviewRow[]>([])
  const [error, setError] = useState('')

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    setFileName(file?.name ?? '')
    setPreviewRows([])
    setError('')

    if (!file) {
      return
    }

    try {
      const text = await file.text()
      setPreviewRows(parseUsersCsv(text))
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'CSVファイルの読み込みに失敗しました。')
    }
  }

  async function handleCreateMany() {
    setError('')

    if (previewRows.length === 0) {
      setError('登録前にCSVファイルをアップロードしてください。')
      return
    }

    await onCreateMany(previewRows.map(({ userId, displayName }) => ({ userId, displayName })))
    setPreviewRows([])
    setFileName('')
  }

  return (
    <section className="card">
      <div className="section-heading">
        <h2>CSV一括登録</h2>
        <p>CSVをアップロードし、確認画面で内容を確認してからユーザを一括登録します。</p>
      </div>
      <div className="form-stack">
        <label>
          <span>CSVファイル</span>
          <input type="file" accept=".csv,text/csv" onChange={handleFileChange} disabled={disabled} />
        </label>
        <div className="csv-format-guide">
          <p className="muted-text">CSV形式: 1行目に userId,displayName を指定してください。displayNameは任意です。</p>
          <pre className="csv-format-example" aria-label="CSVフォーマット例">{`userId,displayName
alice,Alice
bob,`}</pre>
        </div>
        {fileName ? <p className="muted-text">選択中: {fileName}</p> : null}
        {error ? <p className="error-text">{error}</p> : null}
        {previewRows.length > 0 ? (
          <div className="csv-preview">
            <h3>登録内容の確認（{previewRows.length}件）</h3>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>行</th>
                    <th>userId</th>
                    <th>displayName</th>
                  </tr>
                </thead>
                <tbody>
                  {previewRows.map((row) => (
                    <tr key={`${row.rowNumber}-${row.userId}`}>
                      <td>{row.rowNumber}</td>
                      <td>{row.userId}</td>
                      <td>{row.displayName || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}
        <button className="primary-button" type="button" disabled={disabled || previewRows.length === 0} onClick={handleCreateMany}>
          CSVの内容で登録
        </button>
      </div>
    </section>
  )
}
