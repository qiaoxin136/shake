import "./App.css";
import React, { useEffect, useRef, useState, useMemo } from "react";
import { GeoJsonLayer } from "deck.gl";
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
import { Gravity } from "./components/Gravity";
import { FM } from "./components/ForceMain";
// import { Arrow } from "./components/arrow";
import { LiftStation } from "./components/liftStation";
import { MH } from "./components/MH";
import { Address } from "./components/Address";
// import { Flowmeter } from "./components/flowmeter";

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

  let layer1 = new GeoJsonLayer({
    id: "gravity",
    data: Gravity,
    // Styles
    filled: true,
    pointRadiusMinPixels: 2,
    pointRadiusScale: 5,
    lineWidthScale: 1,
    lineWidthMinPixels: 2,
    dataTransform: (d) => d.features,
    // getPointRadius: (f) => 11 - f.properties.scalerank,
    getFillColor: [170, 255, 0, 255],
    getLineColor: [95, 158, 160, 255] /* (f) =>
      select === 0 ? [207, 159, 255, 255] : [255, 255, 255, 255], */,
    getLineWidth: (f) => /* f.properties.condheight > 15 ? 5 : 1 */ 100 / zoom,
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

  let layer2 = new GeoJsonLayer({
    id: "address",
    data: Address,
    // Styles
    filled: true,
    pointRadiusMinPixels: 2,
    pointRadiusScale: 2,
    // getPointRadius: (f) => 11 - f.properties.scalerank,
    getFillColor: (f) => (select === 0 ? [0, 0, 0, 0] : [224, 176, 255, 255]),
    // getLineColor: (f) =>
    //   select === 0 ? [255, 255, 255, 0] : [0, 0, 0, 255],
    // getLineWidth: (f) => (select === 0 ? 1 : 1),
    // Interactive props
    pickable: true,
    autoHighlight: true,
    stroked: false,
    visible: select,

    // onClick: (info) =>
    //   // eslint-disable-next-line
    //   info.object &&
    //   alert(
    //     `MH ID: ${info.object.properties.FACILITYID}\nInvert: ${info.object.properties.NAVD88ELEV}\nRim: ${info.object.properties.RIMNAVD88}  `
    //   ),
    // onClick: (info, events) => {
    //   placeMarker(map, info.object.properties.FACILITYID, events.latLng);
  });
  layers.push(layer2);

  let layer3 = new GeoJsonLayer({
    id: "mh",
    data: MH,
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
  let layer4 = new GeoJsonLayer({
    id: "liftstation",
    data: LiftStation,
    // Styles
    filled: true,
    pointType: "icon",
    iconAtlas:
      "https://mylibraryforuse.s3.amazonaws.com/logo/gis-tl-booster-well-128.png",
    iconMapping: {
      marker: {
        x: 0,
        y: 0,
        width: 128,
        height: 128,
        anchorY: 64,
        anchorX: 64,
        mask: false,
      },
    },
    getIcon: (d) => "marker",
    getIconSize: 10,
    getIconColor: [220, 20, 60, 255],
    getIconAngle: 0,
    iconSizeUnits: "meters",
    iconSizeScale: 5,
    iconSizeMinPixels: 6,
    pointRadiusMinPixels: 2,
    pointRadiusScale: 9,
    // getPointRadius: (f) => 11 - f.properties.scalerank,
    getFillColor: [214, 37, 152, 255],
    // Interactive props
    pickable: true,
    autoHighlight: true,
    getText: (d) => d.properties.FACILITYID,
    getTextColor: [195, 33, 72, 255],
    getTextBackgroundColor: [127, 255, 212, 255],
    textBackground: false,
    textBackgroundPadding: [1, 1],
    textOutlineColor: [0, 0, 0, 255],
    textOutlineWidth: 3,
    textSizeScale: 0.7,

    // sizeScale: 0.2,
    // getSize: 6,
    // onClick: (info) =>
    //   // eslint-disable-next-line
    //   info.object &&
    //   alert(
    //     `Lift Station: ${info.object.properties.FACILITYID}\nBuild Year: ${info.object.properties.BUILDYR}\nType: ${info.object.properties.STATIONTYP}\nWet Well Size: ${info.object.properties.WWSIZE} `
    //   ),
  });

  layers.push(layer4);

  let layer5 = new GeoJsonLayer({
    id: "fm",
    data: FM,
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
    getLineWidth: (f) => (f.properties.DIAMETER > 15 ? 4 : 1),
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

  const overlay = useMemo(
    () =>
      new DeckOverlay({
        layers: layers,
      })
  );

  // console.log(map);

  function Search({ moveTo }) {
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
          layerIds: ["gravity", "address", "mh", "fm", "liftstation"],
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
          if (picked.layer.id === "mh") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Manhole</h3>' +
                "Facility ID: " +
                picked.object.properties.OASISID +
                "<br />" +
                "Invert: " +
                picked.object.properties.Invert +
                "<br />" +
                "RIM: " +
                picked.object.properties.RASTERVALU +
                "</div>"
            );
          } else if (picked.layer.id === "address") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Address</h3>' +
                // "Facility ID: " +
                // picked.object.properties.OASISID +
                // "<br />" +
                "Address: " +
                picked.object.properties.OWNERADDRE +
                "<br />" +
                "Property ID: " +
                picked.object.properties.PROP_ID +
                "<br />" +
                "MH ID: " +
                picked.object.properties.MH_ID +
                "</div>"
            );
          } else if (picked.layer.id === "fm") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Force Main</h3>' +
                "Diameter: " +
                picked.object.properties.DIAMETER +
                "<br />" +
                "Facility ID: " +
                picked.object.properties.OASISPipeI +
                "<br />" +
                "Material: " +
                picked.object.properties.MATERIAL +
                "<br />" +
                "Install Year: " +
                picked.object.properties.YrBuilt +
                "</div>"
            );
          } else if (picked.layer.id === "gravity") {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Gravity Sewer</h3>' +
                "Diameter: " +
                picked.object.properties.DIAMETER +
                "<br />" +
                "Facility ID: " +
                picked.object.properties.FacilityID +
                "<br />" +
                "Material: " +
                picked.object.properties.MATERIAL +
                "</div>"
            );
          } else {
            infowindow.setContent(
              "<div>" +
                '<h3 style="color: blue">Lift Station</h3>' +
                "Facility ID: " +
                picked.object.properties.PSID +
                "<br />" +
                "Name: " +
                picked.object.properties.PumpStatio +
                "<br />" +
                "</div>"
            );
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
      <Search /* moveTo={moveTo} */ />
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
  const center = { lat: 38.0135, lng: -122.5311 };
  const zoom = 14;
  return (
    <>
      <Wrapper
        apiKey={GOOGLE_MAPS_API_KEY}
        libraries={["places"]}
        render={renderMap}
      >
        <MyMapComponent center={center} zoom={zoom} />
      </Wrapper>
    </>
  );
}

export default App;
