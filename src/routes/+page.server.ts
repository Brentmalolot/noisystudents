import { noisyStudentApp, type NoisyStudentData } from "$lib";
import type { PageServerLoad } from "./$types";

export const load = (async () => {
    const noisyStudents = (
        await noisyStudentApp.getNoisyStudentList().findAll()
    ).map((noisyStudent) => {
        return {
            id: noisyStudent.getId(),
            name: noisyStudent.getName(),
        } satisfies Omit<NoisyStudentData, "timeAdded">;
    });
    return { noisyStudents };
}) satisfies PageServerLoad;
