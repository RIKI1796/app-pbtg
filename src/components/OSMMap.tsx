import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

interface OSMMapProps {
  currentPosition: { latitude: number; longitude: number } | null;
  pathPoints: Array<{ latitude: number; longitude: number }>;
  isTracking: boolean;
  isMoving?: boolean;
  isFocused?: boolean;
  onFocusChange?: (focused: boolean) => void;
  onMapMetricsUpdate?: (metrics: { totalDistanceKm: number; totalDistanceMeters: number }) => void;
  height?: number;
}

// Static Leaflet HTML template with MAP_READY signal
const STATIC_LEAFLET_HTML = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
    <style>
      html, body, #map {
        height: 100%;
        width: 100%;
        margin: 0;
        padding: 0;
        background: #f8fafc;
      }
      .leaflet-container { background: #f8fafc !important; }
      .leaflet-control-attribution {
        display: none !important;
      }
      
      .start-pin {
        background-color: #16a34a;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }
      
      .end-pin {
        background-color: #dc2626;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
      }

      .current-pulse-pin {
        background-color: #2563eb;
        border: 2px solid #ffffff;
        border-radius: 50%;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
      }

      .zoom-controls {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        gap: 6px;
      }
      .zoom-btn {
        width: 34px;
        height: 34px;
        background: #ffffff;
        border: 1px solid #cbd5e1;
        color: #0f172a;
        border-radius: 10px;
        font-size: 18px;
        font-weight: 700;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        user-select: none;
        box-shadow: 0 2px 6px rgba(0,0,0,0.08);
        transition: background 0.15s ease;
      }
      .zoom-btn:active {
        background: #fc4c02;
        color: #ffffff;
        border-color: #fc4c02;
      }
    </style>
  </head>
  <body>
    <div class="zoom-controls">
      <div class="zoom-btn" onclick="map.zoomIn()">+</div>
      <div class="zoom-btn" onclick="map.zoomOut()">−</div>
    </div>
    <div id="map"></div>
    <script>
      var map = L.map('map', {
        zoomControl: false,
        attributionControl: false,
        scrollWheelZoom: true,
        touchZoom: true,
        doubleClickZoom: true,
        dragging: true,
        tap: true
      }).setView([-6.2088, 106.8456], 16);
      
      // Esri Satellite HD Base Tile Layer
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19,
        attribution: 'Esri Satellite'
      }).addTo(map);

      // Hybrid Street Lines & Place Names Overlay
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Transportation/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);

      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 19
      }).addTo(map);

      // Solid Blue Route Polyline Line (#2563EB)
      var routePolyline = L.polyline([], {
        color: '#2563eb',
        weight: 6,
        opacity: 0.95,
        lineCap: 'round',
        lineJoin: 'round'
      }).addTo(map);

      var startMarker = null;
      var endMarker = null;
      var currentMarker = null;

      var totalDistanceMeters = 0;
      var lastLatLng = null;

      function resetMapMetrics() {
        totalDistanceMeters = 0;
        lastLatLng = null;
        if (startMarker) { map.removeLayer(startMarker); startMarker = null; }
        if (endMarker) { map.removeLayer(endMarker); endMarker = null; }
        if (currentMarker) { map.removeLayer(currentMarker); currentMarker = null; }
        routePolyline.setLatLngs([]);
      }

      function sendMetrics() {
        var totalKm = totalDistanceMeters / 1000;
        var payload = JSON.stringify({
          type: 'MAP_METRICS_UPDATE',
          totalDistanceMeters: Math.round(totalDistanceMeters * 10) / 10,
          totalDistanceKm: Math.round(totalKm * 100) / 100
        });

        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(payload);
        } else if (window.parent) {
          window.parent.postMessage(payload, '*');
        }
      }

      function sendReadySignal() {
        var payload = JSON.stringify({ type: 'MAP_READY' });
        if (window.ReactNativeWebView) {
          window.ReactNativeWebView.postMessage(payload);
        } else if (window.parent) {
          window.parent.postMessage(payload, '*');
        }
      }

      function updateMapData(points, curPos, trackingState, isMovingState) {
        // Draw Route Polyline & Markers
        if (points && points.length > 0) {
          var latLngs = points.map(function(p) { return [p.latitude, p.longitude]; });
          routePolyline.setLatLngs(latLngs);

          // Fit map bounds to show entire route perfectly
          if (latLngs.length >= 2) {
            try {
              var bounds = routePolyline.getBounds();
              map.fitBounds(bounds, { padding: [25, 25] });
            } catch(e){}
          } else if (latLngs.length === 1) {
            map.setView(latLngs[0], 16);
          }

          // Start marker pin (Green)
          if (!startMarker) {
            var startIcon = L.divIcon({
              className: 'start-pin',
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            startMarker = L.marker(latLngs[0], { icon: startIcon }).addTo(map);
          }

          // End marker pin (Red) if multiple points
          if (latLngs.length >= 2) {
            if (!endMarker) {
              var endIcon = L.divIcon({
                className: 'end-pin',
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              });
              endMarker = L.marker(latLngs[latLngs.length - 1], { icon: endIcon }).addTo(map);
            } else {
              endMarker.setLatLng(latLngs[latLngs.length - 1]);
            }
          }
        } else if (curPos) {
          var curLatLng = L.latLng(curPos.latitude, curPos.longitude);
          map.setView(curLatLng, 16);
          if (!currentMarker) {
            var pulseIcon = L.divIcon({
              className: 'current-pulse-pin',
              iconSize: [14, 14],
              iconAnchor: [7, 7]
            });
            currentMarker = L.marker(curLatLng, { icon: pulseIcon }).addTo(map);
          } else {
            currentMarker.setLatLng(curLatLng);
          }
        }

        if (!trackingState || !isMovingState) return;

        // Calculate distance during live tracking ONLY when user is physically moving (isMovingState === true)
        if (curPos) {
          var curPt = L.latLng(curPos.latitude, curPos.longitude);
          if (lastLatLng) {
            var distM = lastLatLng.distanceTo(curPt);
            if (distM >= 2.0 && distM < 200) {
              totalDistanceMeters += distM;
              lastLatLng = curPt;
              sendMetrics();
            }
          } else {
            lastLatLng = curPt;
            sendMetrics();
          }
        }
      }

      function handleMsg(msg) {
        try {
          var data = typeof msg === 'string' ? JSON.parse(msg) : msg;
          if (data.type === 'UPDATE_ROUTE') {
            updateMapData(data.pathPoints, data.currentPosition, data.isTracking, data.isMoving);
            map.dragging.enable();
            map.touchZoom.enable();
            map.doubleClickZoom.enable();
            map.scrollWheelZoom.enable();
            setTimeout(function() { map.invalidateSize(); }, 50);
          } else if (data.type === 'RESET_MAP') {
            resetMapMetrics();
          }
        } catch(e){}
      }

      window.addEventListener('message', function(e) { handleMsg(e.data); });
      document.addEventListener('message', function(e) { handleMsg(e.data); });

      // Signal map ready to parent container
      setTimeout(sendReadySignal, 150);
    </script>
  </body>
  </html>
`;

export const OSMMap: React.FC<OSMMapProps> = ({
  currentPosition,
  pathPoints,
  isTracking,
  isMoving = false,
  onMapMetricsUpdate,
  height = 360,
}) => {
  const containerRef = useRef<View>(null);
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [isMapReady, setIsMapReady] = useState(false);

  // Send update message to Leaflet via postMessage
  const postUpdate = () => {
    const payload = JSON.stringify({
      type: 'UPDATE_ROUTE',
      pathPoints,
      currentPosition,
      isTracking,
      isMoving,
    });

    if (Platform.OS === 'web') {
      if (iframeRef.current && iframeRef.current.contentWindow) {
        iframeRef.current.contentWindow.postMessage(payload, '*');
      }
    } else {
      if (webViewRef.current) {
        webViewRef.current.postMessage(payload);
      }
    }
  };

  useEffect(() => {
    postUpdate();
  }, [pathPoints, currentPosition, isTracking, isMoving, isMapReady]);

  const handleMapMessage = (event: any) => {
    try {
      const dataStr = typeof event.nativeEvent?.data === 'string'
        ? event.nativeEvent.data
        : (typeof event.data === 'string' ? event.data : null);

      if (!dataStr) return;
      const data = JSON.parse(dataStr);
      if (data.type === 'MAP_READY') {
        setIsMapReady(true);
        postUpdate();
      } else if (data.type === 'MAP_METRICS_UPDATE' && onMapMetricsUpdate) {
        onMapMetricsUpdate({
          totalDistanceKm: data.totalDistanceKm,
          totalDistanceMeters: data.totalDistanceMeters,
        });
      }
    } catch (e) {}
  };

  useEffect(() => {
    if (Platform.OS === 'web') {
      window.addEventListener('message', handleMapMessage);
      return () => window.removeEventListener('message', handleMapMessage);
    }
  }, [onMapMetricsUpdate, pathPoints, currentPosition, isTracking]);

  return (
    <View ref={containerRef} style={[styles.container, { height }]}>
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={STATIC_LEAFLET_HTML}
          style={{
            width: '100%',
            height: '100%',
            border: 'none',
            borderRadius: 0,
            pointerEvents: 'auto',
          }}
          title="Map View"
        />
      ) : (
        <View style={{ flex: 1 }} pointerEvents="auto">
          <WebView
            ref={webViewRef}
            originWhitelist={['*']}
            source={{ html: STATIC_LEAFLET_HTML }}
            style={styles.webView}
            scrollEnabled={false}
            nestedScrollEnabled={true}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            onMessage={handleMapMessage}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    overflow: 'hidden',
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
});
