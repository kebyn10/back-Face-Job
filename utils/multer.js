import multer from 'multer'
import path from 'path'

export const upload = multer({
  storage : multer.diskStorage({
    fileFilter : (req, file, cb) => {
      let ext = path.extname(file.originalname)
      if (ext !== '.jpg' && ext !== '.jpng' && ext !== '.png') {
        cb(new Error('file type is not supported'), false)
        return
      }
      cb(null,true)
    }
  })
})