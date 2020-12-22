import { lang } from 'botpress/shared'
import React, { FC } from 'react'
import { Alert, Card, CardBody, CardText, CardTitle } from 'reactstrap'

import logo from '../../media/nobg_white.png'

interface Props {
  title?: string
  subtitle?: React.ReactNode
  error?: string | null
  poweredBy?: boolean
  children: React.ReactNode
}

export const LoginContainer: FC<Props> = props => {
  return (
    <div className="centered-container auth-background">
      <div className="middle">
        <div className="inner">
          <Card body>
            <img
              className="logo"
              src="https://s3-eu-west-1.amazonaws.com/userlike-cdn-blog/chatbot-design/header-chatbot-design.png"
              width="100"
              alt="loading"
            />
            <CardBody className="login-box">
              <div>
                <CardTitle>
                  <strong>{props.title || 'Botpress'}</strong>
                </CardTitle>
                <CardText>{props.subtitle || ''}</CardText>
                {props.error && <Alert color="danger">{props.error}</Alert>}
                {props.children}
              </div>
            </CardBody>
          </Card>
          {props.poweredBy && (
            <div className="homepage">
              <p>
                {lang.tr('admin.poweredBy')} <a href="https://asista.com">Asista</a>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
