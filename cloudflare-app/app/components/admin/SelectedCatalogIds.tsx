/** Submit the whole selection, including rows not yet rendered by the table. */
export function SelectedCatalogIds({ ids }: { ids: string[] }) {
  return ids.map((id) => <input type="hidden" name="ids" value={id} key={id} />);
}
