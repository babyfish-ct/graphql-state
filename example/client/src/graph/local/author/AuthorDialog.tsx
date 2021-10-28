import { Modal, Form, Input, Collapse, Row, Col } from "antd";
import { useForm } from "antd/lib/form/Form";
import { ModelType } from "graphql-ts-client-api";
import { FC, memo, useCallback, useEffect } from "react";
import UUIDClass from "uuidjs";
import { author$$, book$ } from "../../__generated_local_schema__/fetchers";
import { BookMultiSelect } from "../book/BookMultiSelect";
import { INFORMATION_CLASS, PSEUDO_CODE_CLASS } from "../Css";
import { useStateManager } from "graphql-state";
import { Schema } from "../../__generated_local_schema__";

const AUTHOR_EDIT_INFO =
    author$$
    .books(book$.id)
;

type AuthorInput = ModelType<typeof author$$> & {
    readonly bookIds: string[]
};

export const AuthorDialog: FC<{
    value?: ModelType<typeof AUTHOR_EDIT_INFO>,
    onClose: (value?: ModelType<typeof AUTHOR_EDIT_INFO>) => void
}> = memo(({value, onClose}) => {

    const [form] = useForm<AuthorInput>();

    useEffect(() => {
        form.setFieldsValue({
            id: value?.id ?? UUIDClass.generate(),
            name: value?.name ?? "",
            bookIds: value?.books?.map(book => book.id) ?? []
        })
    }, [form, value]);

    const stateManager = useStateManager<Schema>();

    const onOk = useCallback(async () => {
        const input = await form.validateFields();
        const info: ModelType<typeof AUTHOR_EDIT_INFO> = {
            id: input.id,
            name: input.name,
            books: input.bookIds.map(bookId => ({id: bookId}))
        };
        if (info.id === undefined) {
            throw new Error();
        }
        stateManager.save(AUTHOR_EDIT_INFO, info);
        onClose(info);
    }, [form, onClose, stateManager]);

    const onCancel = useCallback(() => {
        onClose();
    }, [onClose]);

    return (
        <Modal
        visible={true}
        title={`${value === undefined ? 'Create' : 'Edit'} Author`}
        onOk={onOk}
        onCancel={onCancel}
        width={1000}>
            <Form form={form}  labelCol={{span: 8}} wrapperCol={{span: 16}}>
                <Form.Item name="id" hidden={true}/>
                <Form.Item label="Name" name="name">
                    <Input autoComplete="off"/>
                </Form.Item>
                <Form.Item label="Books" name="bookIds">
                    <BookMultiSelect/>
                </Form.Item>
                {BOOKS_DESCRIPTION_ITEM}
            </Form>
            {OK_DESCRIPTION}
        </Modal>
    );
});

const FOR_REMOVED_BOOK = `
if (cached(removeBook.authors)) {
    removeBook.authors.remove(this);
}`;

const FOR_ADDED_BOOK = `
if (cached(addedBook.authors)) {
    addedBook.authors.add(this);
}`;

const BOOKS_DESCRIPTION_ITEM = (
    <Form.Item label=" " colon={false}>
        <Collapse ghost>
            <Collapse.Panel key="title" header="Description of 'Author.books'">
                <div className={INFORMATION_CLASS}>
                    If you change this association "Author.books"
                    <ul>
                        <li>
                            For each removed book, this behavior will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_REMOVED_BOOK}</pre>
                        </li>
                        <li>
                            For each add book, this behavior will be executed automatically
                            <pre className={PSEUDO_CODE_CLASS}>{FOR_ADDED_BOOK}</pre>
                        </li>
                    </ul>
                </div>
            </Collapse.Panel>
        </Collapse>
    </Form.Item>
);

const FOR_INSERTION = `
Query.findAuthors.add(this);
`;

const OK_DESCRIPTION = (
    <Row>
        <Col flex={1}/>
        <Col>
            <Collapse ghost>
                <Collapse.Panel key="title" header="Description of 'OK' button">
                    <div className={INFORMATION_CLASS}>
                        If this dialog is used to insert new object into cache
                        <pre className={PSEUDO_CODE_CLASS}>{FOR_INSERTION}</pre>
                    </div>
                </Collapse.Panel>
            </Collapse>
        </Col>
    </Row>
);