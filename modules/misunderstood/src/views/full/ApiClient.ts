import { DateRange } from '@blueprintjs/datetime'
import { AxiosRequestConfig, AxiosStatic } from 'axios'
import moment from 'moment'

import { FLAGGED_MESSAGE_STATUS, ResolutionData, RESOLUTION_TYPE } from '../../types'

const MODULE_URL_PREFIX = '/mod/misunderstood'

class ApiClient {
  constructor(private axios: AxiosStatic) {}

  async get(url: string, config?: AxiosRequestConfig) {
    const res = await this.axios.get(url, config)
    return res.data
  }

  async post(url: string, data?: any, config?: AxiosRequestConfig) {
    const res = await this.axios.post(url, data, config)
    return res.data
  }

  getForModule(url: string, config?: AxiosRequestConfig) {
    return this.get(MODULE_URL_PREFIX + url, config)
  }

  postForModule(url: string, data?: any, config?: AxiosRequestConfig) {
    return this.post(MODULE_URL_PREFIX + url, data, config)
  }

  getEventCounts(language: string, dateRange?: DateRange) {
    const { start, end } = this.getRangeUnix(dateRange)

    return this.getForModule('/events/count', {
      params: {
        language,
        start,
        end
      }
    })
  }

  getEvents(language: string, status: string, dateRange?: DateRange) {
    const { start, end } = this.getRangeUnix(dateRange)

    return this.getForModule(`/events/${status}`, {
      params: {
        language,
        start,
        end
      }
    })
  }

  getEvent(id: string) {
    return this.getForModule(`/events/${id}`)
  }

  updateStatus(id: string, status: FLAGGED_MESSAGE_STATUS, resolutionData?: ResolutionData) {
    return this.postForModule(`/events/${id}/status`, {
      status,
      ...resolutionData,
      resolutionParams:
        resolutionData && resolutionData.resolutionParams ? JSON.stringify(resolutionData.resolutionParams) : undefined
    })
  }

  applyAllPending() {
    return this.postForModule('/apply-all-pending')
  }

  getRangeUnix(dateRange?: DateRange) {
    let start, end
    if (dateRange) {
      // Use end day if start is null to get single day
      start = (dateRange[0] ? moment(dateRange[0]) : moment(dateRange[1])).unix()
      // Use start day if end is null to get single day and add a day to end in order to get full
      end = (dateRange[1] ? moment(dateRange[1]) : moment(dateRange[0])).add(1, 'days').unix()
    }
    return { start, end }
  }
}

export default ApiClient
