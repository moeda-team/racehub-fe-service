import { QRCodeSVG } from "qrcode.react";

interface TicketProps {
  /** Public registration number (distinct from BIB, FR-407). */
  registrationNumber: string;
  name: string;
  event: string;
  distance: string;
  /** Set only for running events; falsy hides the row. */
  ageClass?: string;
  /** Set only for running events; falsy hides the row. */
  gender?: string;
  date?: string;
  /** Opaque token encoded into the QR for check-in. */
  qrToken: string;
  className?: string;
}

export default function Ticket({
  registrationNumber,
  name,
  event,
  distance,
  ageClass,
  gender,
  date,
  qrToken,
  className = "",
}: TicketProps) {
  const dashIdx = registrationNumber.indexOf("-");
  const regPrefix = dashIdx !== -1 ? registrationNumber.slice(0, dashIdx + 1) : "";
  const regCode = dashIdx !== -1 ? registrationNumber.slice(dashIdx + 1) : registrationNumber;

  return (
    <div className={`ticket ${className}`}>
      {/* Stub on the LEFT — QR + registration code, perforated right edge */}
      <div className="stub">
        <div className="qr">
          <QRCodeSVG value={qrToken} size={72} level="M" />
        </div>
        <div className="bibn">
          {regPrefix}<b>{regCode}</b>
        </div>
      </div>

      {/* Info on the RIGHT */}
      <div className="info">
        <div className="ev">{event}</div>
        <div className="nm">{name}</div>
        <div className="grid">
          <div>
            <div className="k">Jarak</div>
            <div className="v">{distance}</div>
          </div>
          {gender && (
            <div>
              <div className="k">Jenis Kelamin</div>
              <div className="v">
                {gender === "male" ? "Laki-laki" : gender === "female" ? "Perempuan" : gender}
              </div>
            </div>
          )}
          {ageClass && (
            <div>
              <div className="k">Kelas Usia</div>
              <div className="v">{ageClass}</div>
            </div>
          )}
          {date && (
            <div>
              <div className="k">Tanggal</div>
              <div className="v">{date}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
