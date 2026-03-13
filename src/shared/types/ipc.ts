export type IpcChannel =
  | 'download:fetchMetadata'
  | 'download:start'
  | 'download:cancel'
  | 'download:resume'
  | 'binary:checkAndUpdate'
  | 'binary:getStatus'
  | 'settings:get'
  | 'settings:set'
  | 'clipboard:toggle'
  | 'dialog:openFolder'

export type IpcEvent =
  | 'download:progress'
  | 'download:completed'
  | 'download:error'
  | 'clipboard:linkDetected'

export interface IpcResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
}
