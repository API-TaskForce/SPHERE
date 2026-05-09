import { useEffect, useState } from 'react';
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
    const newSelected = value.includes(name)
      ? value.filter(item => item !== name)
      : [...value, name];
    onChange(newSelected);
  };

  useEffect(() => {
    getLoggedUserDatasheets()
      .then(data => {
        if (data.error) throw new Error(data.error);
        else if (data.datasheets?.datasheets)
          setDatasheets(data.datasheets.datasheets.map((d: any) => d.name));
        else setDatasheets([]);
      })
      .catch(error => console.error('Cannot GET datasheets. Error:', error));
  }, [getLoggedUserDatasheets]);

  return datasheets.length > 0 ? (
    <div className="flex flex-wrap gap-4 border border-[#ccc] rounded-2xl p-4">
      {datasheets.map((name: string) => (
        <SelectablePricingCard
          key={name}
          name={name}
          selected={value.includes(name)}
          onClick={() => handleCardClick(name)}
        />
      ))}
    </div>
  ) : (
    <></>
  );
}
