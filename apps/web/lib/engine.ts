import { getDefaultClassifier } from '@hireaware/engine/default-classifier';

/** The recruitment-risk classifier, loaded once per server instance. */
export const classifier = getDefaultClassifier();

export const MAX_TEXT = 20_000;
