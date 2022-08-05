import "./App.css";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { GeoJsonLayer, MVTLayer } from "deck.gl";
import { Wrapper, Status } from "@googlemaps/react-wrapper";
import { GoogleMapsOverlay as DeckOverlay } from "@deck.gl/google-maps";

import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from "use-places-autocomplete";
import {
  Combobox,
  ComboboxInput,
  ComboboxPopover,
  ComboboxList,
  ComboboxOption,
} from "@reach/combobox";

import "@reach/combobox/styles.css";

import { mapStyles } from "./components/mapStyles";
import { Node } from "./components/node";
import { Channel } from "./components/channel";
import { Conduit } from "./components/conduit";
import { Culvert } from "./components/culvert";
import { Basin } from "./components/subbasin";

import Amplify from "aws-amplify";
import awsconfig from "./aws-exports";
import {
  AmplifyAuthenticator,
  AmplifySignUp,
  AmplifySignIn,
  AmplifySignOut,
} from "@aws-amplify/ui-react";

Amplify.configure(awsconfig);

const GOOGLE_MAPS_API_KEY = "AIzaSyBsntctk2YsoHxr_PeyfjeNhzbQZ_d4gsw";

const renderMap = (status) => {
  if (status === Status.LOADING) return <h3>{status} ..</h3>;
  if (status === Status.FAILURE) return <h3>{status} ...</h3>;
  return null;
};

const options = {
  disableDefaultUI: false,
  panControl: true,
  zoomControl: true,
  scaleControl: true,
  scaleControlOptions: {},
  mapTypeControl: true,
  mapTypeControlOptions: {
    // style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
    mapTypeIds: ["roadmap", "terrain", "satellite", "hybrid"],
  },
  overviewMapControl: true,
  rotateControl: true,
  rotateControlOptions: { ControlPosition: "RC" },
  streetViewControl: true,
  streetViewControlOptions: {
    // position: LEFT_TOP,
  },
  // streetViewControl: true,
  styles: mapStyles,
};

// const json = [{ cool: "34.33" }, { alsocool: "45454" }];
// json.push({ coolness: "34.33" });

function MyMapComponent({ center, zoom, tilt }) {
  const ref = useRef();
  const [map, setMap] = useState(null);
  const [select, setSelect] = useState(false);
  const [moveTo, setMoveto] = useState({ lat: 0, lng: 0 });

  function handleSelectLayer(event) {
    setSelect(!select);
  }

  let layers = [];

  let layer2 = new GeoJsonLayer({
    id: "basin",
    data: Basin,
    pickable: true,
    stroked: true,
    filled: false,
    // extruded: true,
    // pointType: "circle",
    lineWidthScale: 2,
    lineWidthMinPixels: 2,
    getFillColor: [255, 0, 255, 1] /* [255, 0, 255, 1], */,
    getLineColor: (f) =>
      f.properties.Lead === "Frank"
        ? [224, 176, 255, 255]
        : f.properties.Lead === "Don"
        ? [240, 128, 128, 255]
        : f.properties.Lead === "Connor"
        ? [144, 238, 144, 255]
        : f.properties.Lead === "Mike"
        ? [65, 105, 225, 255]
        : f.properties.Lead === "Elaine"
        ? [255, 195, 0, 255]
        : [255, 160, 122, 255],
    getPointRadius: 100,
    getLineWidth: 1,
    pointType: "circle+text",
    gettext: (f) => f.properties.Lead,
  });

  layers.push(layer2);

  let layer21 = new MVTLayer({
    id: "topo",
    data: `https://a.tiles.mapbox.com/v4/qiaoxin136.4tn6grfv/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoicWlhb3hpbjEzNiIsImEiOiJja2ppcXZuZ3IzeTQzMnlwOWd6OXRuejRmIn0.Y1EfxKBZfwUhfP-Oc7ozEw`,

    minZoom: 0,
    maxZoom: 23,
    getLineColor: [255, 140, 105],
    getFillColor: [140, 170, 180],
    lineWidthMinPixels: 1,
    pickable: true,
    visible: select,
  });

  layers.push(layer21);

  let layer1 = new GeoJsonLayer({
    id: "channel",
    data: Channel,
    // Styles
    filled: true,
    pointRadiusMinPixels: 2,
    pointRadiusScale: 5,
    lineWidthScale: 1,
    lineWidthMinPixels: 1,
    dataTransform: (d) => d.features,
    // getPointRadius: (f) => 11 - f.properties.scalerank,
    getFillColor: [170, 255, 0, 255],
    getLineColor: [95, 158, 160, 255] /* (f) =>
      select === 0 ? [207, 159, 255, 255] : [255, 255, 255, 255], */,
    getLineWidth: (f) => (f.properties.DIAMETER > 15 ? 2 : 4),
    lineWidthUnits: "pixels",
    // Interactive props
    pickable: true,
    autoHighlight: true,
    // visible: select,
    // onHover: (info) =>
    //   // eslint-disable-next-line
    //   info.object &&
    //   alert(`Diameter (in): ${info.object.properties.condheight}`),
  });

  layers.push(layer1);

  // let layer2 = new GeoJsonLayer({
  //   id: "address",
  //   data: Address,
  //   // Styles
  //   filled: true,
  //   pointRadiusMinPixels: 2,
  //   pointRadiusScale: 2,
  //   // getPointRadius: (f) => 11 - f.properties.scalerank,
  //   getFillColor: (f) => (select === 0 ? [0, 0, 0, 0] : [224, 176, 255, 255]),
  //   // getLineColor: (f) =>
  //   //   select === 0 ? [255, 255, 255, 0] : [0, 0, 0, 255],
  //   // getLineWidth: (f) => (select === 0 ? 1 : 1),
  //   // Interactive props
  //   pickable: true,
  //   autoHighlight: true,
  //   stroked: false,
  //   visible: select,

  //   // onClick: (info) =>
  //   //   // eslint-disable-next-line
  //   //   info.object &&
  //   //   alert(
  //   //     `MH ID: ${info.object.properties.FACILITYID}\nInvert: ${info.object.properties.NAVD88ELEV}\nRim: ${info.object.properties.RIMNAVD88}  `
  //   //   ),
  //   // onClick: (info, events) => {
  //   //   placeMarker(map, info.object.properties.FACILITYID, events.latLng);
  // });
  // layers.push(layer2);

  // let layer2 = new MVTLayer({
  //   id: "mvtdata",
  //   data: `https://a.tiles.mapbox.com/v4/qiaoxin136.738omlu5/{z}/{x}/{y}.vector.pbf?access_token=pk.eyJ1IjoicWlhb3hpbjEzNiIsImEiOiJja2ppcXZuZ3IzeTQzMnlwOWd6OXRuejRmIn0.Y1EfxKBZfwUhfP-Oc7ozEw`,

  //   minZoom: 0,
  //   maxZoom: 23,
  //   getLineColor: [255, 140, 105],
  //   getFillColor: [140, 170, 180],
  //   lineWidthMinPixels: 3,
  //   pickable: true,
  // });

  // layers.push(layer2);

  let layer5 = new GeoJsonLayer({
    id: "conduit",
    data: Conduit,
    // Styles
    filled: true,
    pointRadiusMinPixels: 2,
    pointRadiusScale: 5,
    lineWidthScale: 1.5,
    lineWidthMinPixels: 2,
    // getPointRadius: (f) => 11 - f.properties.scalerank,
    getFillColor: [170, 255, 0, 255],
    getLineColor: /*  [207, 159, 255, 255], */ (f) =>
      f.properties.DIAMETER > 18 ? [65, 105, 225, 255] : [95, 158, 160, 255],
    getLineWidth: (f) => (f.properties.DIAMETER > 15 ? 2 : 1),
    // Interactive props
    pickable: true,
    autoHighlight: true,
    // onClick: (info) =>
    //   // eslint-disable-next-line
    //   info.object &&
    //   alert(
    //     `Diameter (in): ${info.object.properties.DIAMETER} \nMaterial: ${info.object.properties.MATERIAL}\nFacility ID: ${info.object.properties.FACILITYID}`
    //   ),
    // onHover: (info) =>
    //   // eslint-disable-next-line
    //   info.object &&
    //   alert(`Diameter (in): ${info.object.properties.DIAMETER} `),
  });
  layers.push(layer5);

  let layer6 = new GeoJsonLayer({
    id: "culvert",
    data: Culvert,
    // Styles
    filled: true,
    pointRadiusMinPixels: 2,
    pointRadiusScale: 5,
    lineWidthScale: 1.5,
    lineWidthMinPixels: 2,
    // getPointRadius: (f) => 11 - f.properties.scalerank,
    getFillColor: [170, 255, 0, 255],
    getLineColor: /*  [207, 159, 255, 255], */ (f) =>
      f.properties.DIAMETER > 18 ? [65, 105, 225, 255] : [255, 105, 180, 255],
    getLineWidth: (f) => (f.properties.DIAMETER > 15 ? 2 : 1),
    // Interactive props
    pickable: true,
    autoHighlight: true,
    // onClick: (info) =>
    //   // eslint-disable-next-line
    //   info.object &&
    //   alert(
    //     `Diameter (in): ${info.object.properties.DIAMETER} \nMaterial: ${info.object.properties.MATERIAL}\nFacility ID: ${info.object.properties.FACILITYID}`
    //   ),
    // onHover: (info) =>
    //   // eslint-disable-next-line
    //   info.object &&
    //   alert(`Diameter (in): ${info.object.properties.DIAMETER} `),
  });
  layers.push(layer6);

  let layer3 = new GeoJsonLayer({
    id: "node",
    data: Node,
    // Styles
    filled: true,
    getIconAngle: 0,
    getIconColor: [0, 0, 0, 255],
    getIconPixelOffset: [-2, 2],
    getIconSize: 3,
    // getText: (f) => f.properties.FACILITYID,
    getPointRadius: 12,
    getTextAlignmentBaseline: "center",
    getTextAnchor: "middle",
    getTextAngle: 0,
    getTextBackgroundColor: [0, 0, 0, 255],
    getTextBorderColor: [0, 0, 0, 255],
    getTextBorderWidth: 0,
    getTextColor: [0, 0, 0, 255],
    getTextPixelOffset: [-12, -12],
    getTextSize: 20,
    pointRadiusMinPixels: 2,
    pointRadiusScale: 3,
    getPointRadius: (f) => 11 - f.properties.scalerank,
    getFillColor: [255, 195, 0, 255],
    // Interactive props
    pickable: true,
    autoHighlight: true,
    // ...choice,
    // pointRadiusUnits: "pixels",
    pointType: "circle+text",
  });
  layers.push(layer3);

  const overlay = useMemo(
    () =>
      new DeckOverlay({
        layers: layers,
      })
  );

  // console.log(map);

  function Search(moveTo) {
    const {
      ready,
      value,
      suggestions: { status, data },
      setValue,
      clearSuggestions,
    } = usePlacesAutocomplete({
      requestOptions: {
        location: { lat: () => 38.0135, lng: () => -122.5311 },
        radius: 200 * 1000,
      },
    });

    //   const panTo = React.useCallback(({ lat, lng }) => {
    //   ref.current.panTo({ lat, lng });
    //   ref.current.setZoom(14);
    //   // setMarkers((current) => [
    //   //   // ...current,
    //   //   {
    //   //     lat,
    //   //     lng,
    //   //     time: new Date(),
    //   //   },
    //   // ]);
    // }, []);

    const handleInput = (e) => {
      setValue(e.target.value);
    };

    const handleSelect = async (address) => {
      setValue(address, false);
      clearSuggestions();

      try {
        const results = await getGeocode({ address });
        const { lat, lng } = await getLatLng(results[0]);
        moveTo = { lat, lng };
        console.log(moveTo);
        map.setCenter(moveTo);
        map.setZoom(18);
      } catch (error) {
        console.log("😱 Error: ", error);
      }
    };

    return (
      <div className="search">
        <Combobox onSelect={handleSelect}>
          <ComboboxInput
            value={value}
            onChange={handleInput}
            disabled={!ready}
            placeholder="Search your location"
          />
          <ComboboxPopover>
            <ComboboxList>
              {status === "OK" &&
                data.map(({ id, description }) => (
                  <ComboboxOption key={id} value={description} />
                ))}
            </ComboboxList>
          </ComboboxPopover>
        </Combobox>
      </div>
    );
  }

  useEffect(() => {
    if (map) {
      map.setCenter(center);
      map.setZoom(zoom);
      overlay.setMap(map);
      const contentString = '<div id="content">' + "</div>";
      map.addListener("click", (event) => {
        const picked = overlay._deck.pickObject({
          x: event.pixel.x,
          y: event.pixel.y,
          radius: 4,
          layerIds: ["channel", "conduit", "node", "culvert", "basin", "topo"],
        });

        console.log(picked);

        const infowindow = new window.google.maps.InfoWindow({
          content: contentString,
        });

        const marker = new window.google.maps.Marker({
          position: { lat: picked.coordinate[1], lng: picked.coordinate[0] },
          icon: "https://mylibraryforuse.s3.amazonaws.com/logo/empty.png",
          map,
          // title: "Uluru (Ayers Rock)",
        });

        // console.log(marker);

        console.log(picked ? picked.object.properties : "none");
        if (picked) {
          if (picked.layer.id === "node") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Node</h3>' +
                "Facility ID: " +
                picked.object.properties.FACILITYID +
                "<br />" +
                "Measure Down: " +
                picked.object.properties.MEASDOWN +
                "<br />" +
                "Ground: " +
                picked.object.properties.GROUND_ELE +
                "</div>"
            );
          } else if (picked.layer.id === "channel") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Channel</h3>' +
                "Diameter: " +
                picked.object.properties.DIAMETER +
                "<br />" +
                "Facility ID: " +
                picked.object.properties.FACILITYID +
                "<br />" +
                "Channel Type: " +
                picked.object.properties.CHAN_TYP +
                "<br />" +
                "Upstream Invert: " +
                picked.object.properties.INV_ELUS +
                "<br />" +
                "Downstream Invert: " +
                picked.object.properties.INV_ELDS +
                "</div>"
            );
          } else if (picked.layer.id === "topo") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Topo</h3>' +
                "Contour: " +
                picked.object.properties.Contour +
                "</div>"
            );
          } else if (picked.layer.id === "basin") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Subbasin</h3>' +
                "Subbasin ID: " +
                picked.object.properties.SubbasinID +
                "<br />" +
                "Lead: " +
                picked.object.properties.Lead +
                "</div>"
            );
          } else if (picked.layer.id === "conduit") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Conduit</h3>' +
                "Diameter: " +
                picked.object.properties.DIAMETER +
                "<br />" +
                "Facility ID: " +
                picked.object.properties.FACILITYID +
                "<br />" +
                "Rise: " +
                picked.object.properties.RISE +
                "<br />" +
                "Span: " +
                picked.object.properties.SPAN +
                "<br />" +
                "UpStream Invert: " +
                picked.object.properties.INV_ELUS +
                "<br />" +
                "Downstream Invert: " +
                picked.object.properties.INV_ELDS +
                "</div>"
            );
          } else if (picked.layer.id === "culvert") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Culvert</h3>' +
                "Diameter: " +
                picked.object.properties.DIAMETER +
                "<br />" +
                "Facility ID: " +
                picked.object.properties.FACILITYID +
                "<br />" +
                "Rise: " +
                picked.object.properties.RISE +
                "<br />" +
                "Span: " +
                picked.object.properties.SPAN +
                "<br />" +
                "UpStream Invert: " +
                picked.object.properties.INV_ELUS +
                "<br />" +
                "Downstream Invert: " +
                picked.object.properties.INV_ELDS +
                "</div>"
            );
          } else {
            // infowindow.setContent(
            //   "<div>" +
            //     '<h3 style="color: blue">Lift Station</h3>' +
            //     "Facility ID: " +
            //     picked.object.properties.PSID +
            //     "<br />" +
            //     "Name: " +
            //     picked.object.properties.PumpStatio +
            //     "<br />" +
            //     "</div>"
            // );
          }

          infowindow.open({
            anchor: marker,
            map,
            shouldFocus: false,
          });
        } else {
          infowindow.close();
        }
      });
    }
    // console.log(moveTo);
  }, [map, center, zoom, select, overlay]);

  useEffect(() => {
    const map = new window.google.maps.Map(ref.current, {
      options: options,
    });
    // console.log(map);
    const contentString = '<div id="content">' + "</div>";

    setMap(map);
  }, [select]);

  return (
    <>
      <Search moveTo={moveTo} />
      <div ref={ref} id="map" style={{ height: "100vh", width: "98wh" }}></div>

      <div>
        <input
          onChange={handleSelectLayer}
          type="checkbox"
          style={{
            position: "absolute",
            top: 20,
            left: 190,
            backgroundColor: "#FFBB34",
            borderColor: "#555555",
            borderWidth: 0,
            borderRadius: 0,
            // marginTop: 200,
            // justifyContent: "flex-start",
          }}
        ></input>
      </div>
    </>
  );
}

function App() {
  const center = { lat: 35.0827, lng: -78.8784 };
  const zoom = 15;
  return (
    <AmplifyAuthenticator usernameAlias="email">
      <AmplifySignUp
        slot="sign-up"
        usernameAlias="email"
        formFields={[
          {
            type: "email",
            label: "Custom Email Label",
            placeholder: "Custom email placeholder",
            inputProps: { required: true, autocomplete: "username" },
          },
          {
            type: "password",
            label: "Custom Password Label",
            placeholder: "Custom password placeholder",
            inputProps: { required: true, autocomplete: "new-password" },
          },
        ]}
      />
      <AmplifySignIn
        headerText="Cross Creek Flooding Study"
        slot="sign-in"
        usernameAlias="email"
        formFields={[
          {
            type: "email",
            label: "Your Email",
            placeholder: "email",
            inputProps: { required: true, autocomplete: "username" },
          },
          {
            type: "password",
            label: "Your Password",
            placeholder: "password",
            inputProps: { required: true, autocomplete: "new-password" },
          },
        ]}
      />
      <Wrapper
        apiKey={GOOGLE_MAPS_API_KEY}
        libraries={["places"]}
        render={renderMap}
      >
        <MyMapComponent center={center} zoom={zoom} />
      </Wrapper>
      <div>
        <AmplifySignOut style={{ position: "absolute", left: 0, bottom: 0 }} />
      </div>
    </AmplifyAuthenticator>
  );
}

export default App;
