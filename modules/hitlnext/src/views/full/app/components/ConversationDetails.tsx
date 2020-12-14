import { lang, Tabs } from 'botpress/shared'
import cx from 'classnames'
import _ from 'lodash'
import React, { FC } from 'react'

import { IHandoff } from '../../../../types'
import style from '../../style.scss'
import { ApiType } from '../../Api'

import { Comments } from './Comments'
import UserProfile from './UserProfile'
import { Tags } from './Tags'

interface Props {
  api: ApiType
  handoff: IHandoff
}

const ConversationDetails: FC<Props> = ({ api, handoff }) => (
  <div className={cx(style.column, style.sidebarContainer)}>
    <Tabs tabs={[{ id: 'user', title: lang.tr('module.hitlnext.handoff.contactDetails') }]} />
    <UserProfile {...handoff.user} />
    <div className={style.divider}></div>
    <Tags handoff={handoff} api={api} />
    <div className={style.divider}></div>
    <Comments handoff={handoff} api={api} />
  </div>
)

export default ConversationDetails
