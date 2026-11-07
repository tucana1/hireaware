/** The bundled recruitment-risk model, ready to use. Imports ~2.7 MB of JSON, so load it lazily in UIs. */
import model from '../model/risk-model.json';
import { RiskClassifier, type RiskModelJson } from './classifier';

let instance: RiskClassifier | null = null;

export function getDefaultClassifier(): RiskClassifier {
  instance ??= new RiskClassifier(model as unknown as RiskModelJson);
  return instance;
}
