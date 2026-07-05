import { ImageResponse } from 'next/og'

export const dynamic = "force-static";

// Image metadata
export const size = {
    width: 512,
    height: 512,
}
export const contentType = 'image/png'

export default function Icon() {
    return new ImageResponse(
        (
            <div
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#07070c',
                    color: '#ff3b57',
                    fontSize: 320,
                    fontWeight: '900',
                    border: '24px solid #ff3b57',
                }}
            >
                <div style={{ transform: 'skewX(-15deg)' }}>D</div>
            </div>
        ),
        {
            ...size,
        }
    )
}
