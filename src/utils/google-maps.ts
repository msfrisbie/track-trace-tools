export interface IGoogleMapsStep {
    html_instructions: string
}

export interface IGoogleMapsLeg {
    start_address: string,
    end_address: string,
    steps: IGoogleMapsStep[]
}

export interface IGoogleMapsDirections {
    legs: IGoogleMapsLeg[]
}

function stripHtmlTags(value: string): string {
  return value.replace(/<[^>]*>?/gm, '').replace(/&nbsp;/gm, ' ');
}

function splitMultiStep(value: string): string[] {
  return value.split('<div style="font-size:0.9em">');
}

export function extractTextDirections(directions: IGoogleMapsDirections): string {
  const leg = directions.legs[0];

  const flattenedSteps: string[] = leg.steps.map((step) => splitMultiStep(step.html_instructions)).flat().map((step) => `- ${stripHtmlTags(step)}`);

  const directionText: string = `ORIGIN: ${leg.start_address}
    
${flattenedSteps.join('\n')}

DESTINATION: ${leg.end_address}`;

  return directionText;
}

export function isStubAddress(address: string): boolean {
  if (address.toUpperCase().includes('N/A')) {
    return true;
  }

  return false;
}
