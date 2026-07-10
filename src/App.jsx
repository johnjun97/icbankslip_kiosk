import logo from './assets/logo.png'
import './App.css'
import { useState } from 'react'
import { supabase } from './lib/supabase'
import { QRCodeCanvas } from 'qrcode.react'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/TextLayer.css'
import 'react-pdf/dist/Page/AnnotationLayer.css'

pdfjs.GlobalWorkerOptions.workerSrc =
  `https://unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function App() {

  const [qrCode, setQrCode] = useState(null)
  const [agree, setAgree] = useState(false)
  const [loading, setLoading] = useState(false)

  const [files, setFiles] = useState({
    icFront: null,
    icBack: null,
    bankSlip: null
  })

  const handleFileChange = (e, fileName) => {
    const file = e.target.files[0]

    if (file) {
      setFiles({
        ...files,
        [fileName]: {
          file: file,
          preview: URL.createObjectURL(file)
        }
      })
    }
  }

  const uploadFile = async (file, folder) => {
    if (!file) return null

    const fileName = `${Date.now()}-${file.name}`

    const { data, error } = await supabase.storage
      .from('uploads')
      .upload(`${folder}/${fileName}`, file)

    if (error) {
      console.error('Upload error:', error)
      return null
    }

    return data.path
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    setLoading(true)

    try {
      const icFrontPath = await uploadFile(
        files.icFront?.file,
        "ic-front"
      )

      const icBackPath = await uploadFile(
        files.icBack?.file,
        "ic-back"
      )

      const bankSlipPath = await uploadFile(
        files.bankSlip?.file,
        "bank-slip"
      )

      const qrValue = `NIR-${Date.now()}`

      const { data, error } = await supabase
        .from('submissions')
        .insert({
          ic_front_path: icFrontPath,
          ic_back_path: icBackPath,
          bank_slip_path: bankSlipPath,
          status: 'Pending',
          qrcode: qrValue
        })
        .single()

      if (error) {
        throw error
      }

      setQrCode(qrValue)

    } catch (error) {
      console.error(error)

    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            Uploading documents...
          </div>
        </div>
      )}

      <div className="app">


        <div className="form-container">
          <img src={logo} alt="Logo" />

          <p>Fill in the above information.</p>

          <form onSubmit={handleSubmit}>
            <div>
              <label>IC Front Image:</label>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, "icFront")}
              />
            </div>

            <div>
              <label>IC Back Image:</label>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, "icBack")}
              />
            </div>

            <div>
              <label>Bank Slip:</label>

              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => handleFileChange(e, "bankSlip")}
              />
            </div>
            <div className="preview-box">

              <h3>
                {files.icFront || files.icBack || files.bankSlip
                  ? "Uploaded Documents"
                  : "No document uploaded yet"}
              </h3>

              <div className="ic-preview-row">

                {files.icFront && (
                  <div className="file-card">
                    <img src={files.icFront.preview} alt="IC Front" />

                    <div>
                      <p>IC Front</p>
                      <small>{files.icFront.file.name}</small>
                    </div>
                  </div>
                )}

                {files.icBack && (
                  <div className="file-card">
                    <img src={files.icBack.preview} alt="IC Back" />

                    <div>
                      <p>IC Back</p>
                      <small>{files.icBack.file.name}</small>
                    </div>
                  </div>
                )}

              </div>

              {files.bankSlip && (
                <div className="file-card">

                  {files.bankSlip.file.type === "application/pdf" ? (
                    <div className="pdf-thumbnail">
                      <Document file={files.bankSlip.preview}>
                        <Page
                          pageNumber={1}
                          width={70}
                        />
                      </Document>
                    </div>
                  ) : (
                    <img src={files.bankSlip.preview} alt="Bank Slip" />
                  )}


                  <div>
                    <p>Bank Slip</p>
                    <small>{files.bankSlip.file.name}</small>
                  </div>

                </div>
              )}

            </div>

            <div>
              <label>
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                />

                By Clicking on Submit, You agree to Nirvana's{" "}
                <a href="/terms-and-conditions.pdf" target="_blank">
                  Terms and Conditions of Use
                </a>
              </label>

              <br />

              <span>
                To learn more about how Nirvana collects, uses, shares, and protects your personal data,
                please see Nirvana's{" "}
                <a href="/privacy-policy.pdf" target="_blank">
                  Privacy Policy
                </a>
              </span>
            </div>

            <button
              type="submit"
              disabled={!agree || loading}
            >
              {loading ? "Uploading..." : "Submit"}
            </button>
          </form>
          {qrCode && (
            <div className="qr-box">
              <h3>Upload Successful</h3>

              <p>Please scan this QR code at the kiosk.</p>

              <QRCodeCanvas
                value={qrCode}
                size={200}
              />

              <p>{qrCode}</p>
            </div>
          )}
        </div>
      </div>
    </>
  )
}

export default App