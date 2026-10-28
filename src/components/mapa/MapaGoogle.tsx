"use client";

import { useEffect } from "react";
import { useTheme } from "next-themes";
import { APIProvider, AdvancedMarker, AdvancedMarkerAnchorPoint, ColorScheme, Map, useMap } from "@vis.gl/react-google-maps";
import type { Ubicacion } from "@/lib/conductor.types";
import type { PropsMapa } from "@/components/mapa/MapaEstacionamientos";
import { MarcadorPrecio, MarcadorUbicacion } from "@/components/mapa/MarcadorPrecio";
import { MapaControles } from "@/components/mapa/MapaControles";
import { config } from "@/lib/config";

/** Mapa real de Google con los pines de precio (AdvancedMarker con contenido propio). */
export function MapaGoogle(props: PropsMapa) {
  const { resolvedTheme } = useTheme();
  return (
    <APIProvider apiKey={config.googleMapsKey} language="es" region="AR">
      <div className="relative h-full w-full">
        <Map
          // Cambiar el esquema de color exige recrear el mapa.
          key={resolvedTheme}
          mapId={config.googleMapId}
          defaultCenter={props.centro}
          defaultZoom={15}
          gestureHandling="greedy"
          disableDefaultUI
          clickableIcons={false}
          colorScheme={resolvedTheme === "dark" ? ColorScheme.DARK : ColorScheme.LIGHT}
          onClick={() => props.onSeleccionar(null)}
          className="h-full w-full"
        >
          <AdvancedMarker position={props.centro} anchorPoint={AdvancedMarkerAnchorPoint.TOP_LEFT} zIndex={0}>
            <MarcadorUbicacion />
          </AdvancedMarker>
          {props.estacionamientos.map((e) => (
            <AdvancedMarker
              key={e.id}
              position={e.ubicacion}
              anchorPoint={AdvancedMarkerAnchorPoint.TOP_LEFT}
              zIndex={e.id === props.seleccionadoId ? 3 : e.estado === "sold_out" ? 1 : 2}
            >
              <MarcadorPrecio est={e} seleccionado={e.id === props.seleccionadoId} onClick={() => props.onSeleccionar(e.id)} />
            </AdvancedMarker>
          ))}
          <Seguir props={props} />
        </Map>
        <ControlesGoogle centro={props.centro} />
      </div>
    </APIProvider>
  );
}

/** Lleva el mapa hasta el estacionamiento elegido desde la lista. */
function Seguir({ props }: { props: PropsMapa }) {
  const map = useMap();
  useEffect(() => {
    const e = props.estacionamientos.find((x) => x.id === props.seleccionadoId);
    if (map && e) map.panTo(e.ubicacion);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, props.seleccionadoId]);
  return null;
}

function ControlesGoogle({ centro }: { centro: Ubicacion }) {
  const map = useMap();
  const zoom = (d: number) => map?.setZoom((map.getZoom() ?? 15) + d);
  return <MapaControles onAcercar={() => zoom(1)} onAlejar={() => zoom(-1)} onCentrar={() => map?.panTo(centro)} />;
}
