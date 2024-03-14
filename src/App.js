import React from "react";
import "./App.css";

import HLS from "hls.js";
import DASH from "dashjs";

const isHLS = (url) => {
  return url.includes(".m3u8");
};

const isDASH = (url) => {
  return url.includes(".mpd");
};

const setupHLSPlayer = (stream, playerRef) => {
  if (!HLS.isSupported()) {
    console.error("HLS is not supported in this browser.");
    return false;
  }

  try {
    const config = stream.license_url
      ? {
          emeEnabled: true,
          drmSystems: {
            "com.widevine.alpha": {
              licenseUrl: stream.license_url,
            },
          },
          backBufferLength: 30, // https://github.com/video-dev/hls.js/blob/master/docs/API.md#backbufferlength
        }
      : undefined;

    const hls = new HLS(config);
    hls.loadSource(stream.src);
    hls.attachMedia(playerRef);

    return true;
  } catch (err) {
    console.error(err);
  }

  return false;
};

const setupDASHPlayer = (stream, playerRef) => {
  try {
    const player = DASH.MediaPlayer().create();
    player.initialize(playerRef, stream.src, true);
    player.updateSettings({
      "streaming": {
        "bufferToKeep": 30, // https://cdn.dashjs.org/latest/jsdoc/module-Settings.html#~Buffer:~:text=buffer%20in%20seconds.-,bufferToKeep,-number
      }
    });

    if (stream.license_url) {
      player.setProtectionData({
        "com.widevine.alpha": {
          serverURL: stream.license_url,
        },
      });
    }

    return true;
  } catch (error) {
    console.error(error);
  }

  return false;
};

function App() {
  const [entry, setEntry] = React.useState(null);
  const videoRef = React.useRef(null);

  const onSubmit = (e) => {
    e.preventDefault();

    const form = e.target;
    const formData = new FormData(form);

    const src = formData.get("src");
    const license_url = formData.get("license_url") || undefined;

    setEntry({ src, license_url });
  };

  React.useEffect(() => {
    if (entry) {
      if (isHLS(entry.src)) {
        setupHLSPlayer(entry, videoRef.current);
      } else if (isDASH(entry.src)) {
        setupDASHPlayer(entry, videoRef.current);
      } else {
        console.error("Invalid video format");
      }
    }
  }, [entry]);

  return (
    <div className="App">
      <header className="App-header">
        {entry ? (
          <video autoPlay controls ref={videoRef}></video>
        ) : (
          <form method="post" onSubmit={onSubmit}>
            <label htmlFor="src">Video URL</label>
            <input
              name="src"
              required
              placeholder="https://video-stream.m3u8 or https://video-stream.mpd"
            />
            <label htmlFor="license_url">License URL</label>
            <input
              name="license_url"
              placeholder="https://widevine-license-server/..."
            />

            <button type="submit">PLAY</button>
          </form>
        )}
      </header>
    </div>
  );
}

export default App;
