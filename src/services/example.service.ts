import * as exampleRepository from '../repositories/example.repository';

export function listExamples() {
    return exampleRepository.findAll();
}
