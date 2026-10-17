import { LocationState } from '../../services/location-master.service';

export function districtsForState(
  states: LocationState[],
  stateId: number | string | null | undefined
): LocationState['districts'] {
  const selectedStateId = Number(stateId);
  return states.find(state => state.id === selectedStateId)?.districts || [];
}