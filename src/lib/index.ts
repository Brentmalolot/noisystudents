import "reflect-metadata";
import {
    PrismaClient,
    type NoisyStudent as PrismaNoisyStudentData,
} from "@prisma/client";
import { autoInjectable, container, inject, injectable } from "tsyringe";

export type NoisyStudentData = PrismaNoisyStudentData;

interface NoisyStudentRepository {
    create(noisyStudentData: NoisyStudentData): Promise<NoisyStudentData>;
    saveChanges(
        noisyStudentData: Partial<NoisyStudentData>
    ): Promise<NoisyStudentData>;
    findById(id: number): Promise<NoisyStudentData>;
    existById(id: number): Promise<boolean>;
    findAll(): Promise<NoisyStudentData[]>;
    count(): Promise<number>;
    deleteById(id: number): Promise<void>;
}

@injectable()
class PrismaNoisyStudentRepository implements NoisyStudentRepository {
    constructor(@inject("prismaClient") private prismaClient: PrismaClient) {}

    async create(noisyStudentData: {
        id: number;
        name: string;
        timeAdded: Date;
    }): Promise<{ id: number; name: string; timeAdded: Date }> {
        return await this.prismaClient.noisyStudent.create({
            data: noisyStudentData,
        });
    }

    async saveChanges(
        noisyStudentData: Partial<{ id: number; name: string; timeAdded: Date }>
    ): Promise<{ id: number; name: string; timeAdded: Date }> {
        const studentExists =
            noisyStudentData.id && (await this.existById(noisyStudentData.id));
        if (studentExists) {
            return await this.prismaClient.noisyStudent.update({
                data: noisyStudentData,
                where: { id: noisyStudentData.id },
            });
        }
        throw Error("Noisy student does not exist");
    }

    async findById(
        id: number
    ): Promise<{ id: number; name: string; timeAdded: Date }> {
        if (!(await this.existById(id)))
            throw Error("Noisy student does not exist");
        return await this.prismaClient.noisyStudent.findUniqueOrThrow({
            where: { id },
        });
    }

    async existById(id: number): Promise<boolean> {
        return (
            (await this.prismaClient.noisyStudent.count({ where: { id } })) > 0
        );
    }

    async findAll(): Promise<{ id: number; name: string; timeAdded: Date }[]> {
        return await this.prismaClient.noisyStudent.findMany({
            orderBy: { timeAdded: "desc" },
        });
    }

    async count(): Promise<number> {
        return await this.prismaClient.noisyStudent.count();
    }

    async deleteById(id: number): Promise<void> {
        await this.prismaClient.noisyStudent.delete({ where: { id } });
    }
}

@autoInjectable()
class NoisyStudent {
    constructor(
        private id: number,
        private name: string,
        @inject("noisyStudentRepository")
        private noisyStudentRepository?: NoisyStudentRepository
    ) {}

    getId(): number {
        return this.id;
    }

    getName(): string {
        return this.name;
    }

    async updateName(): Promise<NoisyStudent> {
        const studentData = (await this.noisyStudentRepository?.saveChanges({
            id: this.getId(),
            name: this.name,
        })) as NoisyStudentData;
        this.name = studentData.name;
        return this;
    }
}

interface NoisyStudentList {
    listStudent(noisyStudentData: NoisyStudentData): Promise<NoisyStudent>;
    findNoisyStudent(id: number): Promise<NoisyStudent>;
    findAll(): Promise<NoisyStudent[]>;
    removeStudent(noisyStudent: NoisyStudent): Promise<void>;
}

@injectable()
class StandardNoisyStudentList implements NoisyStudentList {
    constructor(
        @inject("noisyStudentRepository")
        private noisyStudentRepository: NoisyStudentRepository
    ) {}

    async findNoisyStudent(id: number): Promise<NoisyStudent> {
        return await this.noisyStudentRepository
            .findById(id)
            .then(
                (noisyStudent) =>
                    new NoisyStudent(noisyStudent.id, noisyStudent.name)
            );
    }

    async findAll(): Promise<NoisyStudent[]> {
        return await this.noisyStudentRepository
            .findAll()
            .then((students) =>
                students.map(
                    (student) => new NoisyStudent(student.id, student.name)
                )
            );
    }

    async listStudent(noisyStudentData: {
        id: number;
        name: string;
        timeAdded: Date;
    }): Promise<NoisyStudent> {
        return await this.noisyStudentRepository
            .create(noisyStudentData)
            .then(
                (noisyStudentData) =>
                    new NoisyStudent(
                        noisyStudentData.id as number,
                        noisyStudentData.name
                    )
            );
    }

    async removeStudent(noisyStudent: NoisyStudent): Promise<void> {
        await this.noisyStudentRepository.deleteById(noisyStudent.getId());
    }
}

@injectable()
class NoisyStudentApp {
    constructor(
        @inject("noisyStudentList")
        private noisyStudentList: NoisyStudentList
    ) {}

    getNoisyStudentList(): NoisyStudentList {
        return this.noisyStudentList;
    }
}

container.register<PrismaClient>("prismaClient", {
    useValue: new PrismaClient(),
});

container.register<NoisyStudentRepository>("noisyStudentRepository", {
    useClass: PrismaNoisyStudentRepository,
});

container.register<NoisyStudentList>("noisyStudentList", {
    useClass: StandardNoisyStudentList,
});

export const noisyStudentApp = container.resolve(NoisyStudentApp);
