import '@uppy/core/dist/style.css'
import '@uppy/dashboard/dist/style.css'

import React from 'react'
import { Dashboard } from '@uppy/react'
import Uppy from '@uppy/core'
import Webcam from '@uppy/webcam'

function Uploader (props) {
  const uppy = React.useMemo(() => {
    return new Uppy()
      .use(Webcam) // `id` defaults to "Webcam". Note: no `target` option!
      // or
      .use(Webcam, { id: 'MyWebcam' }) // `id` is… "MyWebcam"
  }, [])
  React.useEffect(() => {
    return () => uppy.close({ reason: 'unmount' })
  }, [uppy])

  return (
    <Dashboard
      uppy={uppy}
      plugins={['Webcam']}
      {...props}
    />
  )
}

export default Uploader;