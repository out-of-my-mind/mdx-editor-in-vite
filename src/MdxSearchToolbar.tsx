import React from 'react'
import { useEditorSearch } from '@mdxeditor/editor'

export const SimpleSearchUI = () => {
  const { search, setSearch, next, prev, total, cursor } = useEditorSearch()

  return (
    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
      <input type="text" value={search ?? ''} onChange={(e) => setSearch(e.target.value)} placeholder="Search document..." />
      <button onClick={prev} disabled={total === 0}>
        &lt; Prev
      </button>
      <span>{total > 0 ? `${cursor} / ${total}` : '0 / 0'}</span>
      <button onClick={next} disabled={total === 0}>
        Next &gt;
      </button>
    </div>
  )
}