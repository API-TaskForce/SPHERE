import { useEffect, useState } from 'react';
//ts-ignore
import { Grid2 } from '@mui/material';
import SelectablePricingCard from '../selectable-pricing-card';
import { useDatasheetsApi } from '../../../datasheet/api/datasheetsApi';

type MultiSelectCardsProps = {
  readonly value: string[];
  readonly onChange: (selectedNames: string[]) => void;
};

export default function DatasheetSelector({ value, onChange }: MultiSelectCardsProps) {
  const [datasheets, setDatasheets] = useState<string[]>([]);

  const { getLoggedUserDatasheets } = useDatasheetsApi();

  const handleCardClick = (name: string) => {
    let newSelected: string[];
    if (value.includes(name)) {
      newSelected = value.filter(item => item !== name);
    } else {
      newSelected = [...value, name];
    }

    onChange(newSelected);
  };

  useEffect(() => {
    getLoggedUserDatasheets()
      .then(data => {
        if (data.error) {
          throw new Error(data.error);
        } else if (data.datasheets?.datasheets) {
          setDatasheets(data.datasheets.datasheets.map((datasheet: any) => datasheet.name));
        } else {
          setDatasheets([]);
        }
      })
      .catch(error => {
        console.error('Cannot GET datasheets. Error:', error);
      });
  }, [getLoggedUserDatasheets]);

  return datasheets.length > 0 ? (
    <Grid2 container spacing={2} sx={{ border: '1px solid #ccc', borderRadius: 4, padding: 2 }}>
      {datasheets.map((name: string) => (
        <Grid2 key={name}>
          <SelectablePricingCard
            name={name}
            selected={value.includes(name)}
            onClick={() => handleCardClick(name)}
          />
        </Grid2>
      ))}
    </Grid2>
  ) : (
    <></>
  );
}
