import React, { useEffect, useRef, useState } from "react";
import Map from "@arcgis/core/Map";
import MapView from "@arcgis/core/views/MapView";
import esriRequest from "@arcgis/core/request";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import PopupTemplate from "@arcgis/core/PopupTemplate";
import GroupLayer from "@arcgis/core/layers/GroupLayer";
import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import LayerList from "@arcgis/core/widgets/LayerList";
import Search from "@arcgis/core/widgets/Search";
import Locate from "@arcgis/core/widgets/Locate";
import Legend from "@arcgis/core/widgets/Legend";
import Expand from "@arcgis/core/widgets/Expand";
import Compass from "@arcgis/core/widgets/Compass";
import Editor from "@arcgis/core/widgets/Editor";
import { createRoot } from "react-dom/client";
import HazardsFilter from "./HazardsFilter";
import { useAuth } from "./AuthContext";

interface MapComponentProps {
  featureServiceUrl: string;
  isAddHazardBtnClicked: boolean;
  openAddHazardModal: () => void;
  cancelAddHazardPoint: () => void;
  hazardData: HazardData | null;
  resetHazardData: () => void;
  setAllLayers: React.Dispatch<React.SetStateAction<LayerInfo[]>>;
}

interface HazardData {
  category: string;
  subcategory: string;
  description: string;
  date: string;
  media: File[];
}

interface LayerInfo {
  id: number;
  name: string;
  url: string;
}

const MapComponent: React.FC<MapComponentProps> = ({
  featureServiceUrl,
  isAddHazardBtnClicked,
  openAddHazardModal,
  cancelAddHazardPoint,
  hazardData,
  resetHazardData,
  setAllLayers,
}) => {
  const { user } = useAuth();
  const isAdmin = () => user?.role === "Admin";

  const isSpecialUser = () => user?.role === "SpecialUser";

  const isUser = () => user?.role === "User";

  const mapRef = useRef<HTMLDivElement>(null);

  const [_, setMap] = useState<Map | null>(null);
  const [view, setView] = useState<MapView | null>(null);
  const [hazardPoint, setHazardPoint] = useState<Point | null>(null);

  const [isSubmittingPoint, setIsSubmittingPoint] = useState(false);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  const [layers, setLayers] = useState<LayerInfo[]>([]);
  const [internalLayers, setInternalLayers] = useState<LayerInfo[]>([]);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setAllLayers(internalLayers);
  }, [internalLayers, setAllLayers]);

  useEffect(() => {
    const fetchLayers = async () => {
      try {
        const response = await esriRequest(featureServiceUrl, {
          query: { f: "json" },
          responseType: "json",
        });

        const layersInfo = response.data.layers.map((layer: any) => ({
          id: layer.id,
          name: layer.name,
          url: `${featureServiceUrl}/${layer.id}`,
        }));

        setLayers(layersInfo);
        setInternalLayers(layersInfo);
      } catch (error) {
        console.error("Error fetching layers:", error);
        setError("Failed to fetch layers");
      }
    };
    fetchLayers();
  }, [featureServiceUrl]);

  useEffect(() => {
    if (!mapRef.current || layers.length === 0) return;

    try {
      const newMap = new Map({
        basemap: "streets-navigation-vector",
      });

      const newView = new MapView({
        container: mapRef.current!,
        map: newMap,
        zoom: 14,
        center: [-77.6109, 43.1566],
      });

      const featureLayers = layers.map((layer) => {
        const isHazardLayer = [
          "Severe Weather",
          "Traffic",
          "Buildings",
          "Public Safety",
          "Utility Problems",
        ].includes(layer.name);
        return new FeatureLayer({
          url: layer.url,
          outFields: ["*"],
          id: layer.id.toString(),
          popupTemplate: isHazardLayer
            ? createPopupTemplate(layer.name)
            : undefined,
          title: layer.name,
          visible: isHazardLayer,
        });
      });

      const hazardLayerTitles = [
        "Severe Weather",
        "Traffic",
        "Buildings",
        "Public Safety",
        "Utility Problems",
      ];
      const hazardLayers = featureLayers.filter((layer) =>
        hazardLayerTitles.includes(layer.title)
      );
      const otherLayers = featureLayers.filter(
        (layer) => !hazardLayerTitles.includes(layer.title)
      );

      hazardLayers.forEach((layer) => (layer.visible = true));

      const hazardsLayerGroup = new GroupLayer({
        title: "Hazards",
        layers: hazardLayers,
        visibilityMode: "independent",
        visible: true,
      });

      otherLayers.forEach((layer, index) => {
        newMap.add(layer, index);
      });

      newMap.add(hazardsLayerGroup, otherLayers.length);

      const searchWidget = new Search({
        view: newView,
      });

      const searchWidgetExpand = new Expand({
        view: newView,
        content: searchWidget,
        group: "top-right",
        expandTooltip: "Search",
      });

      const locateWidget = new Locate({
        view: newView,
      });

      const layerWidget = new LayerList({
        view: newView,
        listItemCreatedFunction: (event) => {
          const item = event.item;
          if (item.layer.title === "Hazards") {
            item.children = [];
          }
        },
      });

      const layerWidgetExpand = new Expand({
        view: newView,
        content: layerWidget,
        group: "top-right",
        expandTooltip: "Layers",
      });

      const legendWidget = new Legend({
        view: newView,
      });

      const legendWidgetExpand = new Expand({
        view: newView,
        content: legendWidget,
        group: "top-right",
        expandTooltip: "Legends",
      });

      const compassWidget = new Compass({
        view: newView,
      });

      const editor = new Editor({
        view: newView,
      });

      const editorExpand = new Expand({
        view: newView,
        content: editor,
        group: "top-right",
        expandTooltip: "Edit Features",
      });

      newView.ui.add(searchWidgetExpand, "top-right");

      if (isAdmin() || isSpecialUser() || isUser()) {
        newView.ui.add(layerWidgetExpand, "bottom-left");
      }

      newView.ui.add(legendWidgetExpand, "bottom-left");

      newView.ui.add(locateWidget, "bottom-right");

      newView.ui.add(compassWidget, "top-left");

      if (isAdmin() || isSpecialUser()) {
        newView.ui.add(editorExpand, "top-right");
      }

      const filterContainer = document.createElement("div");
      newView.ui.add(
        new Expand({
          view: newView,
          content: filterContainer,
          expandIcon: "filter",
          group: "top-right",
          expandTooltip: "Filters",
        }),
        "top-right"
      );

      const root = createRoot(filterContainer);
      root.render(<HazardsFilter layers={hazardLayers} />);

      newView.when();

      setMap(newMap);
      setView(newView);

      setIsMapInitialized(true);
    } catch (error) {
      console.error("Error initializing map:", error);
      setError("Failed to initialize map");
      setIsMapInitialized(false);
    }

    return () => {
      if (view) {
        view.destroy();
      }
    };
  }, [layers, hazardData, user]);

  useEffect(() => {
    if (view && isMapInitialized) {
      view.container.style.cursor = isAddHazardBtnClicked
        ? `url('images/icons/pointer/AddHazard.png') 28 52, auto`
        : "default";

      const clickHandler = view.on("click", (event) => {
        if (isAddHazardBtnClicked) {
          const { mapPoint } = event;
          setHazardPoint(mapPoint);
          openAddHazardModal();
        }
      });

      const rightClickHandler = view.on("immediate-click", (event) => {
        if (isAddHazardBtnClicked && event.button === 2) {
          cancelAddHazardPoint();
        }
      });

      return () => {
        clickHandler.remove();
        rightClickHandler.remove();
      };
    }
  }, [view, isAddHazardBtnClicked, openAddHazardModal, cancelAddHazardPoint]);

  const createPopupTemplate = (title: string) => {
    return new PopupTemplate({
      title: title,
      content: [
        {
          type: "fields",
          fieldInfos: [
            { fieldName: "Hazard_Subcategory", label: "Type" },
            { fieldName: "Hazard_Description", label: "Description" },
            {
              fieldName: "Hazard_Date_Reported",
              label: "Reported Date",
              format: { dateFormat: "short-date-short-time" },
            },
            { fieldName: "Hazard_Submitted_By", label: "Submitted By" },
            { fieldName: "Hazard_Status", label: "Status" },
          ],
        },
        {
          type: "attachments",
          displayType: "preview",
          content: [
            { type: "text", text: "Attachments:" },
            {
              type: "attachments",
              displayType: "list",
              media: [
                {
                  type: "image",
                  mediaInfos: [
                    {
                      type: "image",
                      value: { sourceURL: "{imageAttachmentUrl}" },
                    },
                  ],
                },
                {
                  type: "video",
                  mediaInfos: [
                    {
                      type: "video",
                      value: { sourceURL: "{videoAttachmentUrl}" },
                    },
                  ],
                },
              ],
            },
          ],
        },
      ],
    });
  };

  useEffect(() => {
    if (hazardData && hazardPoint && !isSubmittingPoint) {
      setIsSubmittingPoint(true);

      const targetHazardLayer = layers.find(
        (layer) => layer.name === hazardData.category
      );

      if (targetHazardLayer) {
        const featureLayer = view?.map.findLayerById(
          targetHazardLayer.id.toString()
        ) as FeatureLayer;
        if (featureLayer) {
          const graphic = new Graphic({
            geometry: hazardPoint,
            attributes: {
              OBJECTID: null,
              Hazard_Subcategory: hazardData.subcategory,
              Hazard_Description: hazardData.description,
              Hazard_Date_Reported: hazardData.date,
              Hazard_Submitted_By: user?.username,
            },
          });

          featureLayer
            .applyEdits({
              addFeatures: [graphic],
            })
            .then(({ addFeatureResults }) => {
              if (addFeatureResults && addFeatureResults.length > 0) {
                const objectId = addFeatureResults[0].objectId;

                if (hazardData.media.length > 0) {
                  const attachmentPromises = hazardData.media.map((file) => {
                    const formData = new FormData();
                    formData.append("attachment", file, file.name);

                    const attachmentGraphic = new Graphic({
                      attributes: { OBJECTID: objectId },
                    });

                    return featureLayer.addAttachment(
                      attachmentGraphic,
                      formData
                    );
                  });

                  Promise.all(attachmentPromises)
                    .then((_) => {
                      featureLayer.refresh();
                    })
                    .catch((error) => {
                      console.error("Error adding attachments:", error);
                    });
                }
              } else {
                console.error("No feature was added");
              }
            })
            .catch((error) => {
              console.error("Error adding feature:", error);
            })
            .finally(() => {
              setIsSubmittingPoint(false);
              resetHazardData();
            });

          view?.goTo(hazardPoint);
        } else {
          setIsSubmittingPoint(false);
        }
      } else {
        setIsSubmittingPoint(false);
      }
    }
  }, [hazardData, hazardPoint, layers, view, resetHazardData]);

  if (error) {
    return <div>Error: {error}</div>;
  }

  return <div ref={mapRef} className="w-full h-full" />;
};

export default MapComponent;
