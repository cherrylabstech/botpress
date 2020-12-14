import { lang } from 'botpress/shared'
import _ from 'lodash'
import React, { FC, Fragment, useContext, useState } from 'react'
import { MenuItem } from '@blueprintjs/core'
import { MultiSelect } from '@blueprintjs/select'

import { IHandoff } from '../../../../types'
import { ApiType } from '../../Api'
import { Context } from '../Store'

interface Props {
  api: ApiType
  handoff: IHandoff
}

const StringMultiSelect = MultiSelect.ofType<string>()

export const Tags: FC<Props> = ({ handoff, api }) => {
  const { tags, id } = handoff
  const { state } = useContext(Context)

  const [items, setItems] = useState(_.compact(_.castArray(tags)))

  function handleSelect(value, index) {
    const updated = [...items, value]
    api.updateHandoff(id, { tags: updated }).then(() => setItems(updated))
  }

  function handleRemove(value, index) {
    const updated = _.filter(items, (v, i) => i != index)
    api.updateHandoff(id, { tags: updated }).then(() => setItems(updated))
  }

  function renderTag(tag: string) {
    return tag
  }

  function renderItem(tag, { modifiers, handleClick }) {
    if (!modifiers.matchesPredicate) {
      return null
    }

    return (
      <MenuItem
        active={modifiers.active}
        disabled={isSelected(tag)}
        icon={isSelected(tag) ? 'tick' : 'blank'}
        onClick={handleClick}
        key={tag}
        text={tag}
      />
    )
  }

  function isSelected(tag: string) {
    return items.includes(tag)
  }

  return (
    <Fragment>
      {lang.tr('module.hitlnext.tags.heading')}
      <StringMultiSelect
        fill={true}
        placeholder={lang.tr('module.hitlnext.tags.placeholder')}
        items={state.config.tags}
        selectedItems={items}
        itemRenderer={renderItem}
        onItemSelect={handleSelect}
        tagRenderer={renderTag}
        tagInputProps={{ onRemove: handleRemove }}
      />
    </Fragment>
  )
}
