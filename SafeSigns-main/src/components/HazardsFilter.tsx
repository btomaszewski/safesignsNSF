import React, { useEffect, useState } from 'react'
import FeatureLayer from '@arcgis/core/layers/FeatureLayer'
import { Checkbox, FormControlLabel, FormGroup } from '@mui/material';


interface HazardsFilterProps {
    layers: FeatureLayer[];
}

const HazardsFilter: React.FC<HazardsFilterProps> = ({ layers }) => {

    const [layerVisibility, setLayerVisibility] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const initialVisibility = layers.reduce((acc, layer) => {
          acc[layer.id] = layer.visible;
          return acc;
        }, {} as { [key: string]: boolean });
        setLayerVisibility(initialVisibility);
      }, [layers]);
    
      const handleLayerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const layerId = event.target.name;
        const isVisible = event.target.checked;
    
        setLayerVisibility(prev => ({
          ...prev,
          [layerId]: isVisible
        }));
    
        const layer = layers.find(l => l.id === layerId);
        if (layer) {
          layer.visible = isVisible;
        }
      };

      const getIconPath = (layerTitle: string) => {
        const iconName = layerTitle.replace(/\s+/g, '_') + '.png';
        return `/images/icons/filter-icons/${iconName}`;
      };
    
      return (
        <div className="bg-white p-4 rounded shadow mb-2 sm:mb-0">
          <h3 className="font-bold mb-2 text-lg">Filter Hazards</h3>
          <FormGroup>
            {layers.map((layer) => (
              <FormControlLabel
                key={layer.id}
                control={
                  <Checkbox
                    checked={layerVisibility[layer.id] || false}
                    onChange={handleLayerChange}
                    name={layer.id}
                  />
                }
                label={
                    <div className='flex items-center'>
                        <img 
                            src={getIconPath(layer.title || layer.id)}
                            alt={`${layer.title || layer.id} Icon`}
                            className='w-6 h-6 mr-2'
                        />
                        <span>{layer.title || layer.id}</span>
                    </div>
                }
              />
            ))}
          </FormGroup>
        </div>
    );
};

export default HazardsFilter